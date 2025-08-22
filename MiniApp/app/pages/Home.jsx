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
  const navigate = useNavigate()
  
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
      setUser(u)
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
              <ProfileCard user={user} />
              <div style={{marginTop:16, display:'flex', gap:12, flexWrap:'wrap'}}>
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
