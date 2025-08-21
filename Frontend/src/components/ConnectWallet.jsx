import React from 'react'

export default function ConnectWallet({ onConnect }){
  return (
    <button className="button" onClick={onConnect}>
      一键连接钱包
    </button>
  )
}
