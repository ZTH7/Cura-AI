import React, { useEffect, useMemo, useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from '../config/nft'

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
  const [badges, setBadges] = useState([])

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

  if(!enabled){
    return <div className="notice">尚未配置 NFT 合约地址与 ABI，暂无法展示勋章。</div>
  }
  if(!account){
    return <div className="notice">请先在首页连接钱包，之后回到此处查看你的勋章墙。</div>
  }

  return (
    <div>
      <h3>我的勋章墙</h3>
      {loading && <p>正在读取你的 NFT 勋章…</p>}
      {error && <div className="notice" style={{marginBottom:12}}>{error}</div>}
      {!loading && badges.length === 0 && (
        <p className="small">尚未获得勋章。完成活动或任务即可解锁专属徽章。</p>
      )}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:16, marginTop:12}}>
        {badges.map(b => (
          <div key={b.tokenId} className="card" style={{padding:12, textAlign:'center'}}>
            {b.image ? (
              <img src={b.image} alt={b.name} style={{width:'100%', height:100, objectFit:'cover', borderRadius:12, border:'1px solid #ffe5dc'}} />
            ) : (
              <div style={{width:'100%', height:100, borderRadius:12, border:'1px solid #ffe5dc', background:'#fff'}} />
            )}
            <div className="small" style={{marginTop:8}}>{b.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
