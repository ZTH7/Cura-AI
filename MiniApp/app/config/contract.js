// 占位合约配置：后续请替换为真实地址与 ABI
export const CONTRACT_ADDRESS = '0x1B584B820387b5000e179F112796b8D2082e69B7'
export const ABI = [
    // view
    "function badge() view returns (address)",
    "function getUser(address user) view returns (bool,string,string,uint32,uint32,uint64,uint256)",
    "function userTokens(address user) view returns (uint256[])",
    // actions
    "function register()",
    "function updateUser(string profileCid, string chatCid)",
    "function checkIn()",
    // admin
    "function addRule(uint8 rtype, uint32 thresholdDays, string tokenURI) returns (uint256)",
    "function setRuleActive(uint256 ruleId, bool active)",
    "function setMockDay(uint64 d)"
];

export const NFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
];
