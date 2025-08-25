"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { getUserClient } from '../lib/userClient'
import { CONTRACT_ADDRESS, ABI } from '../config/contract'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import '@coinbase/onchainkit/styles.css'
import OnboardingForm from '../components/OnboardingForm'
import ProfileCard from '../components/ProfileCard'

export default function Home(){
  const { address, isConnected } = useAccount()
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const navigate = useNavigate()
  
  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTooltip && !event.target.closest('.tooltip-container')) {
        setShowTooltip(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTooltip])
  
  // 使用 wagmi 的 address 作为 account
  const account = address

  const userClient = useMemo(() => getUserClient({ provider, signer, contractAddress: CONTRACT_ADDRESS, abi: ABI }), [provider, signer])

  // 如果本地已有上次的钱包地址与资料，自动尝试读取，避免重复填写
  useEffect(() => {
    if(account && !user){
      fetchUser(account)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  // 当账户连接状态变化时，设置 signer 并获取用户数据
  useEffect(() => {
    if(account && isConnected){
      localStorage.setItem('lastAccount', account)
      // 为本地模式提供 signer.getAddress() 的最小实现
      setSigner({ getAddress: async () => account })
      fetchUser(account)
    } else {
      setSigner(null)
      setUser(null)
    }
  }, [account, isConnected])

  const fetchUser = async (addr) => {
    setLoading(true)
    setError('')
    try{
      const u = await userClient.getUser(addr)
      // Add check-in status to user data
      const userWithCheckInStatus = {
        ...u,
        hasCheckedInToday: checkIfSignedInToday(u)
      }
      setUser(userWithCheckInStatus)
    }catch(e){
      setUser(null)
    }finally{
      setLoading(false)
    }
  }

  const handleCreateUser = async (payload) => {
    setLoading(true)
    setError('')
    try{
      await userClient.createUser(payload)
      const addr = signer ? await signer.getAddress() : account
      await fetchUser(addr)
    }catch(e){
      console.error(e)
      setError(e?.shortMessage || e?.message || 'Failed to create user')
    }finally{
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!userClient || !account) return
    
    setCheckingIn(true)
    setError('')
    try {
      const updatedUser = await userClient.checkIn()
      setUser(prev => ({
        ...prev,
        ...updatedUser,
        hasCheckedInToday: true
      }))
    } catch (e) {
      console.error('Check-in failed:', e)
      setError(e?.shortMessage || e?.message || 'Check-in failed')
    } finally {
      setCheckingIn(false)
    }
  }

  // Check if user has already signed in today
  const checkIfSignedInToday = (userData) => {
    if (!userData?.lastDayIndex) return false
    const currentDayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
    return userData.lastDayIndex === currentDayIndex
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          
          <div>
            <div className="title">Cura - Psychological Counseling</div>
            <div className="small">Warm, gentle, and care for your every day</div>
          </div>
        </div>
        {account ? (
          <div className="badge">
            <span>Connected</span>
            <strong>0x…{account.slice(-4)}</strong>
          </div>
        ) : (
          <ConnectWallet />
        )}
      </header>

      <section className="hero">
        <h1>Be kind to yourself, start now</h1>
        <p>Connect your wallet, we will look for your profile in the contract; if not found, we will guide you to create a simple profile.</p>
        {error && <div className="notice" style={{marginTop:12}}>{error}</div>}
      </section>

      <div className="row">
        <div className="card">
          {!account && (
            <>
              <h3>Connect to start</h3>
              <p className="small">Start by clicking the &quot;Connect Wallet&quot; button</p>
            </>
          )}

          {account && loading && (
            <p>Loading your profile…</p>
          )}

          {account && !loading && user && (
            <>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
                <div style={{flex:1}}>
                  <ProfileCard user={user} />
                </div>
                <div className="tooltip-container" style={{display:'flex', alignItems:'center', gap:8, position:'relative'}}>
                  <button
                    onClick={() => setShowTooltip(!showTooltip)}
                    style={{
                      width:'24px',
                      height:'24px',
                      borderRadius:'50%',
                      border:'1px solid var(--accent)',
                      background:'white',
                      color:'var(--accent)',
                      fontSize:'12px',
                      fontWeight:'bold',
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center'
                    }}
                  >
                    ?
                  </button>
                  {showTooltip && (
                    <div style={{
                      position:'absolute',
                      top:'-80px',
                      right:'0',
                      background:'white',
                      border:'1px solid #ffe5dc',
                      borderRadius:'12px',
                      padding:'12px',
                      boxShadow:'var(--shadow)',
                      fontSize:'12px',
                      width:'200px',
                      zIndex:1000
                    }}>
                      <div style={{fontWeight:'bold', marginBottom:'4px'}}>Check-in Rewards:</div>
                      <div>• 7 days → Regular NFT</div>
                      <div>• 30 days → Golden NFT</div>
                    </div>
                  )}
                  <button 
                    className="button" 
                    onClick={handleCheckIn}
                    disabled={checkingIn || user.hasCheckedInToday}
                    style={{
                      minWidth:'80px',
                      background: user.hasCheckedInToday ? '#ffdcd4' : 'var(--accent)',
                      color: user.hasCheckedInToday ? '#3b1f1a' : '#3b1f1a'
                    }}
                  >
                    {checkingIn ? 'Signing...' : user.hasCheckedInToday ? 'Signed' : 'Sign'}
                  </button>
                </div>
              </div>
              <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                <button className="button" style={{flex:'1', textAlign:'center'}} onClick={()=>navigate('/chat')}>Start Talking</button>
                <button className="button" style={{flex:'1', textAlign:'center'}} onClick={()=>navigate('/profile')}>View Badges</button>
              </div>
            </>
          )}

          {account && !loading && !user && (
            <OnboardingForm onSubmit={handleCreateUser} />
          )}
        </div>

        <div className="card">
          <h3>About Cura</h3>
          <p className="small">We are committed to helping you become more aware of yourself, understand yourself, and accept yourself. Your data is under your control, and in the future, it will be managed through smart contracts.</p>
        </div>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} Cura - Psychological Counseling · Using technology and kindness to protect you
      </footer>
    </div>
  )
}
