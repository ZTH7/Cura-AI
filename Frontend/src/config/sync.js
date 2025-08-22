// 同步用合约：用于存储/同步聊天记录的最新 CID
// 请替换为你自己的合约地址与 ABI。这里提供一个占位接口示例：
// function saveChatCID(string cid) external;
export const SYNC_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'
export const SYNC_ABI = [
  {
    "type": "function",
    "name": "saveChatCID",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "cid", "type": "string" }],
    "outputs": []
  }
]
