import React, { useEffect, useMemo, useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from '../config/nft'
// 示例勋章数据
const badges = [
  { id: 1, name: "初次登录", icon: "🏅", earned: true },
  { id: 2, name: "完成心理测试", icon: "🧠", earned: true },
  { id: 3, name: "坚持记录 7 天", icon: "📅", earned: false },
  { id: 4, name: "每日打卡 30 天", icon: "🔥", earned: false },
  { id: 5, name: "分享心得", icon: "💬", earned: true },
  { id: 6, name: "邀请朋友", icon: "🤝", earned: false },
    { id: 7, name: "分享心得", icon: "💬", earned: true },
  { id: 8, name: "邀请朋友", icon: "🤝", earned: false },
];

// 示例心情数据（最近一周）
const moods = [
  { day: "周一", mood: "😊" },
  { day: "周二", mood: "😐" },
  { day: "周三", mood: "😢" },
  { day: "周四", mood: "😄" },
  { day: "周五", mood: "😎" },
  { day: "周六", mood: "🥳" },
  { day: "周日", mood: "😴" },
];

function ipfsToHttp(url){
  if(!url) return ''
  if(url.startsWith('ipfs://')){
    const path = url.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${path}`
  }
  return url
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

export default function BadgeWall(){
  const [account, setAccount] = useState(localStorage.getItem('lastAccount') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [badges, setBadges] = useState([
  { id: 1, name: "初次登录", icon: "🏅", earned: true },
  { id: 2, name: "完成心理测试", icon: "🧠", earned: true },
  { id: 3, name: "坚持记录 7 天", icon: "📅", earned: false },
  { id: 4, name: "每日打卡 30 天", icon: "🔥", earned: false },
  { id: 5, name: "分享心得", icon: "💬", earned: true },
  { id: 6, name: "邀请朋友", icon: "🤝", earned: false },
])

  const enabled = useMemo(() => NFT_CONTRACT_ADDRESS && NFT_CONTRACT_ADDRESS !== ZERO_ADDR && Array.isArray(NFT_ABI) && NFT_ABI.length > 0, [])

  useEffect(() => {
    if(!enabled) return
    if(!account) return
    let cancelled = false
    async function load(){
      setLoading(true)
      setError('')
      try{
        if(!window.ethereum){
          setError('未检测到钱包，无法读取 NFT。')
          return
        }
        const provider = new BrowserProvider(window.ethereum)
        // 只读调用不一定需要请求账户授权，但为了确保链连接，一般请求一次账户
        try { await window.ethereum.request({ method: 'eth_requestAccounts' }) } catch {}
        const contract = new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider)
        const bal = await contract.balanceOf(account)
        const count = Number(bal)
        const items = []
        for(let i=0;i<count;i++){
          const tokenId = await contract.tokenOfOwnerByIndex(account, i)
          const uri = await contract.tokenURI(tokenId)
          const httpUri = ipfsToHttp(uri)
          let meta = null
          try{
            const res = await fetch(httpUri)
            meta = await res.json()
          }catch{}
          items.push({
            tokenId: Number(tokenId),
            name: meta?.name || `Badge #${Number(tokenId)}`,
            image: ipfsToHttp(meta?.image || ''),
          })
        }
        if(!cancelled){ setBadges(items) }
      }catch(e){
        console.error(e)
        if(!cancelled){ setError(e?.message || '读取 NFT 失败') }
      }finally{
        if(!cancelled){ setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [account, enabled])

  // if(!enabled){
  //   return <div className="notice">尚未配置 NFT 合约地址与 ABI，暂无法展示勋章。</div>
  // }
  if(!account){
    return <div className="notice">请先在首页连接钱包，之后回到此处查看你的勋章墙。</div>
  }

return (
<div>
  {/* 个人信息模块 */}
  <div style={{ marginBottom: 24 }}>
    <h3>我的信息</h3>
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: '1rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div>用户名: 张三</div>
      <div>积分: 120</div>
      <div>等级: 初级</div>
    </div>
  </div>

  {/* 勋章墙模块 */}
  <div style={{ marginBottom: 24 }}>
    <h3>我的勋章墙</h3>
    {loading && <p>正在读取你的 NFT 勋章…</p>}
    {error && <div className="notice" style={{ marginBottom: 12 }}>{error}</div>}
    {!loading && badges.length === 0 && (
      <p className="small">尚未获得勋章。完成活动或任务即可解锁专属徽章。</p>
    )}

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginTop: 12,
      }}
    >
      {badges.map(b => (
        <div
          key={b.tokenId || b.id}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            borderRadius: '1rem',
            background: b.earned ? '#fff' : '#eee',
            boxShadow: b.earned ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
            opacity: b.earned ? 1 : 0.4,
            cursor: b.earned ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            if (b.earned) e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {b.image ? (
            <img
              src={b.image}
              alt={b.name}
              style={{
                width: '80px',
                height: 80,
                objectFit: 'cover',
                borderRadius: 12,
                border: '1px solid #ffe5dc',
              }}
            />
          ) : (
            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {b.icon}
            </span>
          )}
          <span style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: 8 }}>
            {b.name}
          </span>
        </div>
      ))}
    </div>
  </div>

  {/* 心情模块，单独横向排列 */}
  <div>
    <h3>我的心情表</h3>
    <div
      style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        marginTop: 12,
      }}
    >
      {moods.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#fff",
            padding: "1rem",
            borderRadius: "1rem",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            width: "80px",
          }}
        >
          <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            {item.mood}
          </span>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>{item.day}</span>
        </div>
      ))}
    </div>
    
  </div>
</div>


);

}
