// 占位 NFT 合约配置：后续请替换为真实地址与 ABI（推荐 ERC-721 Enumerable）
export const NFT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'

// 最小 ERC-721 Enumerable + tokenURI 读取 ABI（常见公开函数）
export const NFT_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "stateMutability": "view",
    "inputs": [{ "name": "owner", "type": "address" }],
    "outputs": [{ "name": "balance", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "tokenOfOwnerByIndex",
    "stateMutability": "view",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "index", "type": "uint256" }
    ],
    "outputs": [{ "name": "tokenId", "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "tokenURI",
    "stateMutability": "view",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [{ "name": "uri", "type": "string" }]
  },
  {
    "type": "function",
    "name": "name",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "name": "name", "type": "string" }]
  }
]
