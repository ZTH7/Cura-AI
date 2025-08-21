import React, { useEffect, useMemo, useState } from 'react'
import { BrowserProvider } from 'ethers'
import { useNavigate } from 'react-router-dom'
import { getUserClient } from '../lib/userClient'
import { CONTRACT_ADDRESS, ABI } from '../config/contract'
import ConnectWallet from '../components/ConnectWallet'
import OnboardingForm from '../components/OnboardingForm'
import ProfileCard from '../components/ProfileCard'

export default function Home(){
  const [account, setAccount] = useState(localStorage.getItem('lastAccount') || null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const userClient = useMemo(() => getUserClient({ provider, signer, contractAddress: CONTRACT_ADDRESS, abi: ABI }), [provider, signer])

  // 如果本地已有上次的钱包地址与资料，自动尝试读取，避免重复填写
  useEffect(() => {
    if(account && !user){
      fetchUser(account)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const handleConnect = async () => {
    setError('')
    try{
      if(!window.ethereum){
        setError('未检测到 MetaMask（或兼容钱包）。请先安装后再试。')
        return
      }
      const prov = new BrowserProvider(window.ethereum)
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const s = await prov.getSigner()
      const addr = await s.getAddress()
      setProvider(prov)
      setSigner(s)
      setAccount(addr)
      localStorage.setItem('lastAccount', addr)
      await fetchUser(addr)
    }catch(e){
      console.error(e)
      setError(e?.shortMessage || e?.message || '连接钱包失败')
    }
  }

  const fetchUser = async (addr) => {
    setLoading(true)
    setError('')
    try{
      const u = await userClient.getUser(addr)
      setUser(u)
    }catch(e){
      if(process.env.NODE_ENV !== 'production'){
        console.debug('getUser:', e?.message || e)
      }
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
      setError(e?.shortMessage || e?.message || '创建用户失败')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <div className="title">心晴 · 心理疏导 DApp</div>
            <div className="small">温暖、柔和、守护你的每一天</div>
          </div>
        </div>
        {account ? (
          <div className="badge">
            <span>已连接</span>
            <strong>{account.slice(0,6)}…{account.slice(-4)}</strong>
          </div>
        ) : (
          <ConnectWallet onConnect={handleConnect} />
        )}
      </header>

      <section className="hero">
        <h1>与自己温柔相处，从此刻开始</h1>
        <p>连接钱包后，我们会在合约中查找你的资料；若未找到，将引导你完成简单的信息创建。</p>
        {error && <div className="notice" style={{marginTop:12}}>{error}</div>}
      </section>

      <div className="row">
        <div className="card">
          {!account && (
            <>
              <h3>一步连接 · 安心开启</h3>
              <p className="small">点击右上角“连接钱包”按钮开始</p>
            </>
          )}

          {account && loading && (
            <p>正在加载你的资料…</p>
          )}

          {account && !loading && user && (
            <>
              <ProfileCard user={user} />
              <div style={{marginTop:16, display:'flex', gap:12, flexWrap:'wrap'}}>
                <button className="button" onClick={()=>navigate('/chat')}>开始疏导</button>
                <button className="button" onClick={()=>navigate('/profile')}>查看勋章墙</button>
              </div>
            </>
          )}

          {account && !loading && !user && (
            <OnboardingForm onSubmit={handleCreateUser} />
          )}
        </div>

        <div className="card">
          <h3>关于心晴</h3>
          <p className="small">我们致力于用更温柔的方式帮助你觉察、理解和接纳自己。你的数据由你掌控，未来将通过智能合约安全管理。</p>
        </div>
      </div>

      <footer className="footer">
        © {new Date().getFullYear()} 心晴 DApp · 用科技与温柔守护你
      </footer>
    </div>
  )
}
