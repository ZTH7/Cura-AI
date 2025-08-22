"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useSignMessage, useWriteContract } from 'wagmi'
import { IPFS_API_URL, IPFS_HEADERS } from '../config/ipfs'
import { CONTRACT_ADDRESS, ABI } from '../config/contract'

function getLocalUser(addr){
  if(!addr) return null
  const raw = localStorage.getItem(`user:${addr.toLowerCase()}`)
  return raw ? JSON.parse(raw) : null
}

export default function Chat(){
  const apiKey = ''
  const { address: account } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { writeContractAsync } = useWriteContract()
  const userProfile = useMemo(() => getLocalUser(account), [account])
  const storageKey = useMemo(() => (account ? `chat:${account.toLowerCase()}` : 'chat:guest'), [account])
  const [messages, setMessages] = useState(() => {
    try{
      const key = account ? `chat:${account.toLowerCase()}` : 'chat:guest'
      const raw = localStorage.getItem(key)
      if(raw){
        const parsed = JSON.parse(raw)
        if(Array.isArray(parsed) && parsed.length){
          return parsed
        }
      }
    }catch{}
    return [{ role: 'assistant', content: 'Hello, I am Cura. I am here to help you with your mental health. Would you like to talk about something?' }]
  })
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // 初次进入或账号变化时，尝试加载历史聊天记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // ========== 加密与 IPFS 备份相关工具 ==========
  async function deriveAesKeyWithSigner(){
    if(!account) throw new Error('Wallet not connected')
    const addr = account.toLowerCase()
    const domainMsg = `Psych DApp chat backup v1\n${addr}`
    const sig = await signMessageAsync({ message: domainMsg })
    // 以签名文本做 SHA-256，导出 32 字节对称密钥
    const enc = new TextEncoder()
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(sig))
    const key = await crypto.subtle.importKey(
      'raw',
      digest,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
    return key
  }

  async function encryptChatJson(json){
    const key = await deriveAesKeyWithSigner()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const plaintext = enc.encode(JSON.stringify(json))
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext))
    const ivB64 = btoa(String.fromCharCode(...iv))
    const ctB64 = btoa(String.fromCharCode(...ciphertext))
    return { v: 1, iv: ivB64, data: ctB64 }
  }

  async function ipfsAddJson(obj){
    const payload = new Blob([JSON.stringify(obj)], { type: 'application/json' })
    const form = new FormData()
    form.append('file', payload, 'chat.enc.json')
    const res = await fetch(`${IPFS_API_URL}/add?pin=true`, {
      method: 'POST',
      body: form,
      headers: IPFS_HEADERS
    })
    if(!res.ok){
      const t = await res.text()
      throw new Error(`Failed to add to IPFS: ${res.status} ${t}`)
    }
    const text = await res.text()
    // go-ipfs 返回 NDJSON，取最后一行解析 Hash
    const lines = text.trim().split(/\r?\n/)
    const last = JSON.parse(lines[lines.length-1])
    const cid = last.Hash || last.Cid || last.cid || ''
    if(!cid) throw new Error('Failed to get CID')
    return cid
  }

  async function saveCidToContract(cid){
    if(!account) throw new Error('Wallet not connected')
    if(!CONTRACT_ADDRESS){
      throw new Error('Sync contract address not configured')
    }
    // Get existing profileCid from local user data
    const existingProfileCid = userProfile?.profileCid || ''
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'updateUser',
      args: [existingProfileCid, cid],
    })
    return hash
  }

  // 入口函数：加密 -> IPFS -> 上链同步 CID
  const encryptedBackup = async () => {
    // alert('Encryption backup completed, CID: Qmdy3zaCRSxH2zB98r1bqVxxErfSrGE9DCw4re9rxsCqBh')
    // Clear all local data
    // localStorage.clear()

    try{
      const snapshot = {
        address: account || null,
        profile: userProfile || null,
        messages,
        ts: Date.now()
      }
      const encObj = await encryptChatJson(snapshot)
      const cid = await ipfsAddJson(encObj)
      // await saveCidToContract(cid)
      alert(`Encryption backup completed, CID: ${cid}`)
    }catch(e){
      console.error(e)
      alert(`Encryption backup failed: ${e?.message || e}`)
    }
  }

  // 消息变化时自动本地持久化（自动保存）
  useEffect(() => {
    try{
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }catch{}
  }, [messages, storageKey])

  const systemPrompt = useMemo(() => {
    const basic = 'You are a gentle, empathetic, and professional psychological support assistant. Respond with concise and warm language, avoid making diagnoses or treatment promises, encourage self-awareness and emotional acceptance, and when necessary, suggest that the user seek professional offline help.'
    if(!userProfile) return basic
    const { nickname, gender, age } = userProfile
    return `${basic}\n\nVisitor basic information:\n- Nickname: ${nickname || 'Not filled'}\n- Gender: ${gender || 'Not filled'}\n- Age: ${age ?? 'Not filled'}\nWhen conversing, use these information to better understand the user, but do not repeat too much.`
  }, [userProfile])

  const sendMessage = async () => {
    if(!apiKey) {
      alert('Please enter OpenAI API Key')
      return
    }
    if(!input.trim()) return

    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try{
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            userMsg
          ]
        })
      })

      if(!resp.ok){
        const errText = await resp.text()
        throw new Error(errText || `OpenAI API error: ${resp.status}`)
      }
      const data = await resp.json()
      const ai = data?.choices?.[0]?.message?.content || 'Pardon me, I don\'t know how to respond.'
      setMessages(prev => [...prev, { role: 'assistant', content: ai }])
    }catch(e){
      console.error(e)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to call OpenAI, please check API Key or try again later.' }])
    }finally{
      setSending(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          
          <div>
            <div className="title">Cura - Psychological Counseling</div>
            <div className="small">Listen to you every day</div>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="button" onClick={encryptedBackup}>Backup</button>
          <button className="button" onClick={() => window.location.href = '/'}>Home</button>
        </div>
      </header>

      <div className="row" style={{marginTop: 16}}>
        <div className="card" style={{flex: '1 1 600px'}}>
          <h3>Chat</h3>
          {!userProfile && (
            <div className="notice" style={{marginBottom:12}}>Profile not found. Please go back to the home page to complete your profile, which will help me better accompany you.</div>
          )}
          <div style={{
            border:'1px solid #ffe5dc', borderRadius:12, padding:16, background:'#fff',
            height: '50vh', overflowY:'auto'
          }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{
                margin:'8px 0',
                display:'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth:'72%',
                  padding:'10px 12px',
                  borderRadius:12,
                  background: m.role === 'user' ? 'var(--accent)' : '#fff',
                  color: m.role === 'user' ? '#3b1f1a' : 'inherit',
                  border: m.role === 'user' ? '1px solid #ffc8bb' : '1px solid #ffe5dc',
                  boxShadow:'var(--shadow)'
                }}>{m.content}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="row" style={{marginTop:12}}>
            <div style={{flex:'1 1 auto'}}>
              <input
                className="input"
                placeholder="Type your message here"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage() } }}
              />
            </div>
            <div>
              <button className="button" onClick={sendMessage} disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
