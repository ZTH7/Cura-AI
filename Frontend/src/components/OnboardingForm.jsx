import React, { useState } from 'react'

export default function OnboardingForm({ onSubmit }){
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('未选择')
  const [age, setAge] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!nickname || !age){
      alert('请填写昵称与年龄')
      return
    }
    setSubmitting(true)
    try{
      await onSubmit({ nickname, gender, age: Number(age) })
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h3>完善你的资料</h3>
      <div>
        <div className="label">昵称</div>
        <input className="input" placeholder="如：小暖" value={nickname} onChange={e=>setNickname(e.target.value)} />
      </div>
      <div>
        <div className="label">性别</div>
        <select className="select" value={gender} onChange={e=>setGender(e.target.value)}>
          <option value="未选择">未选择</option>
          <option value="女">女</option>
          <option value="男">男</option>
          <option value="其他">其他</option>
          <option value="不透露">不透露</option>
        </select>
      </div>
      <div>
        <div className="label">年龄</div>
        <input className="input" type="number" min="1" max="120" placeholder="你的年龄" value={age} onChange={e=>setAge(e.target.value)} />
      </div>
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? '创建中…' : '创建我的资料'}
      </button>
    </form>
  )
}
