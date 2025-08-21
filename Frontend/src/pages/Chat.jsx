import React, { useEffect, useMemo, useRef, useState } from 'react'

function getLastAccount(){
  return localStorage.getItem('lastAccount') || ''
}
function getLocalUser(addr){
  if(!addr) return null
  const raw = localStorage.getItem(`user:${addr.toLowerCase()}`)
  return raw ? JSON.parse(raw) : null
}

export default function Chat(){
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '')
  const [account] = useState(getLastAccount())
  const userProfile = useMemo(() => getLocalUser(account), [account])
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好，我是你的心晴小助手。今天想聊聊什么？' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const systemPrompt = useMemo(() => {
    const basic = '你是一位温柔、共情且专业的心理支持助手。用简洁温暖的话语回应，避免作出诊断与治疗承诺，鼓励自我觉察与情绪接纳，必要时建议用户寻求线下专业帮助。'
    if(!userProfile) return basic
    const { nickname, gender, age } = userProfile
    return `${basic}\n\n来访者基础信息：\n- 昵称：${nickname || '未填写'}\n- 性别：${gender || '未填写'}\n- 年龄：${age ?? '未填写'}\n在对话时，适度利用这些信息以更贴近用户，不要过度重复。`
  }, [userProfile])

  const handleSaveKey = () => {
    localStorage.setItem('openai_api_key', apiKey.trim())
    alert('API Key 已保存到本地浏览器。注意：请勿在公共设备使用。')
  }

  const sendMessage = async () => {
    if(!apiKey) {
      alert('请先输入并保存 OpenAI API Key')
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
          model: 'gpt-4o-mini',
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
        <a className="button" href="#/">返回首页</a>
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

        <div className="card" style={{flex:'1 1 280px'}}>
          <h3>设置</h3>
          <div className="label">OpenAI API Key</div>
          <input className="input" type="password" placeholder="sk-..." value={apiKey} onChange={e=>setApiKey(e.target.value)} />
          <div style={{marginTop:8}}>
            <button className="button" onClick={handleSaveKey}>保存 Key</button>
          </div>
          <p className="small" style={{marginTop:8}}>Key 将仅保存在你的浏览器本地。生产环境建议通过后端代理调用 OpenAI 接口。</p>

          {userProfile && (
            <div style={{marginTop:16}}>
              <h4 style={{margin:'8px 0'}}>我的资料</h4>
              <div className="small">昵称：{userProfile.nickname || '未填写'}</div>
              <div className="small">性别：{userProfile.gender || '未填写'}</div>
              <div className="small">年龄：{userProfile.age ?? '未填写'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
