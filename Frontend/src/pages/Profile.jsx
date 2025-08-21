import React, { useMemo } from 'react'
import BadgeWall from '../components/BadgeWall'

function getLastAccount(){
  return localStorage.getItem('lastAccount') || ''
}
function getLocalUser(addr){
  if(!addr) return null
  const raw = localStorage.getItem(`user:${addr.toLowerCase()}`)
  return raw ? JSON.parse(raw) : null
}

export default function Profile(){
  const account = getLastAccount()
  const user = useMemo(() => getLocalUser(account), [account])

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <div className="title">我的资料与勋章</div>
            <div className="small">连接你的故事与每一枚徽章</div>
          </div>
        </div>
        <a className="button" href="#/">返回首页</a>
      </header>

      <div className="row" style={{marginTop:16}}>
        <div className="card" style={{flex:'1 1 320px'}}>
          <h3>我的信息</h3>
          {user ? (
            <div>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div className="avatar" />
                <div>
                  <div style={{fontWeight:700, fontSize:16}}>{user.nickname}</div>
                  <div className="small">性别：{user.gender || '未填写'} · 年龄：{user.age ?? '未填写'}</div>
                </div>
              </div>
              <div className="small" style={{marginTop:8}}>钱包：{account ? `${account.slice(0,6)}…${account.slice(-4)}` : '未连接'}</div>
            </div>
          ) : (
            <div className="notice">未找到你的资料。请返回首页连接钱包并完善信息。</div>
          )}
        </div>

        <div className="card" style={{flex:'3 1 520px'}}>
          <BadgeWall />
        </div>
      </div>
    </div>
  )
}
