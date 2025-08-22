"use client";

export default function ProfileCard({ user }){
  return (
    <div className="profile">
      <div className="avatar" />
      <div>
        <div style={{fontWeight:700, fontSize:16}}>{user.nickname}</div>
        <div className="small">Gender: {user.gender || 'Not selected'} · Age: {user.age || 'Not selected'}</div>
      </div>
    </div>
  )
}
