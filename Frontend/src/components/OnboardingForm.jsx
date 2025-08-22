import React, { useState } from 'react'

export default function OnboardingForm({ onSubmit }){
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('Not selected')
  const [age, setAge] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!nickname || !age){
      alert('Please fill in nickname and age')
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
      <h3>Complete your profile</h3>
      <div>
        <div className="label">Nickname</div>
        <input className="input" placeholder="e.g. Eva" value={nickname} onChange={e=>setNickname(e.target.value)} />
      </div>
      <div>
        <div className="label">Gender</div>
        <select className="select" value={gender} onChange={e=>setGender(e.target.value)}>
          <option value="Not selected">Not selected</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>
      <div>
        <div className="label">Age</div>
        <input className="input" type="number" min="1" max="120" placeholder="e.g. 20" value={age} onChange={e=>setAge(e.target.value)} />
      </div>
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create my profile'}
      </button>
    </form>
  )
}
