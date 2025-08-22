import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { IPFS_API_URL, IPFS_HEADERS } from '../config/ipfs'
import { SYNC_CONTRACT_ADDRESS, SYNC_ABI } from '../config/sync'

function getLastAccount(){
  return localStorage.getItem('lastAccount') || ''
}
function getLocalUser(addr){
  if(!addr) return null
  const raw = localStorage.getItem(`user:${addr.toLowerCase()}`)
  return raw ? JSON.parse(raw) : null
}

export default function Chat(){
  const apiKey = ''
  const [account] = useState(getLastAccount())
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
    return [{ role: 'assistant', content: '你好，我是你的心晴小助手。今天想聊聊什么？' }]
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
    if(!window.ethereum) throw new Error('未检测到钱包')
    const provider = new BrowserProvider(window.ethereum)
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    const signer = await provider.getSigner()
    const addr = (await signer.getAddress()).toLowerCase()
    const domainMsg = `Psych DApp chat backup v1\n${addr}`
    const sig = await signer.signMessage(domainMsg)
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
      throw new Error(`IPFS add 失败: ${res.status} ${t}`)
    }
    const text = await res.text()
    // go-ipfs 返回 NDJSON，取最后一行解析 Hash
    const lines = text.trim().split(/\r?\n/)
    const last = JSON.parse(lines[lines.length-1])
    const cid = last.Hash || last.Cid || last.cid || ''
    if(!cid) throw new Error('未获取到 CID')
    return cid
  }

  async function saveCidToContract(cid){
    if(!window.ethereum) throw new Error('未检测到钱包')
    if(!SYNC_CONTRACT_ADDRESS || SYNC_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'){
      throw new Error('未配置同步合约地址')
    }
    const provider = new BrowserProvider(window.ethereum)
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    const signer = await provider.getSigner()
    const contract = new Contract(SYNC_CONTRACT_ADDRESS, SYNC_ABI, signer)
    const tx = await contract.saveChatCID(cid)
    await tx.wait()
    return tx.hash
  }

  // 入口函数：加密 -> IPFS -> 上链同步 CID
  const encryptedBackup = async () => {
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
      alert(`加密备份完成，CID: ${cid}`)
    }catch(e){
      console.error(e)
      alert(`加密备份失败：${e?.message || e}`)
    }
  }

  // 消息变化时自动本地持久化（自动保存）
  useEffect(() => {
    try{
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }catch{}
  }, [messages, storageKey])

  const systemPrompt = useMemo(() => {
    const basic = '你是一位温柔、共情且专业的心理支持助手。用简洁温暖的话语回应，避免作出诊断与治疗承诺，鼓励自我觉察与情绪接纳，必要时建议用户寻求线下专业帮助。'
    if(!userProfile) return basic
    const { nickname, gender, age } = userProfile
    return `${basic}\n\n来访者基础信息：\n- 昵称：${nickname || '未填写'}\n- 性别：${gender || '未填写'}\n- 年龄：${age ?? '未填写'}\n在对话时，适度利用这些信息以更贴近用户，不要过度重复。`
  }, [userProfile])

  const sendMessage = async () => {
    if(!apiKey) {
      alert('请先输入 OpenAI API Key')
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
        throw new Error(errText || `OpenAI API 错误：${resp.status}`)
      }
      const data = await resp.json()
      const ai = data?.choices?.[0]?.message?.content || '抱歉，我一时没有想好如何回应。'
      setMessages(prev => [...prev, { role: 'assistant', content: ai }])
    }catch(e){
      console.error(e)
      setMessages(prev => [...prev, { role: 'assistant', content: '调用 OpenAI 失败，请检查 API Key 或稍后再试。' }])
    }finally{
      setSending(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <div className="title">心晴 · 温暖聊天</div>
            <div className="small">温柔陪伴，耐心倾听</div>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="button" onClick={encryptedBackup}>保存备份</button>
          <button className="button" onClick={() => window.location.href = '/'}>返回首页</button>
        </div>
      </header>

      <div className="row" style={{marginTop: 16}}>
        <div className="card" style={{flex: '1 1 600px'}}>
          <h3>开始对话</h3>
          {!userProfile && (
            <div className="notice" style={{marginBottom:12}}>未找到你的资料。返回首页完善资料，可以帮助我更好地陪伴你。</div>
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
                placeholder="想聊些什么？"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage() } }}
              />
            </div>
            <div>
              <button className="button" onClick={sendMessage} disabled={sending}>{sending ? '发送中…' : '发送'}</button>
            </div>
          </div>
          <div className="small" style={{marginTop:8}}>提示：请避免在对话中包含个人隐私、密钥等敏感信息。</div>
        </div>
      </div>
    </div>
  )
}
