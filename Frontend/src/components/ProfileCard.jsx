import React from 'react'

export default function ProfileCard({ user }){
  return (
    <div className="profile">
      <div className="avatar" />
      <div>
        <div style={{fontWeight:700, fontSize:16}}>{user.nickname}</div>
        <div className="small">性别：{user.gender || '未填写'} · 年龄：{user.age || '未填写'}</div>
      </div>
    </div>
  )
}
