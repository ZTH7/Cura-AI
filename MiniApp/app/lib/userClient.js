import { Contract } from 'ethers'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

function hasRealContract(contractAddress, abi){
  return contractAddress && contractAddress !== ZERO_ADDR && Array.isArray(abi) && abi.length > 0
}

function lsKey(addr){
  return `user:${addr?.toLowerCase?.()}`
}

export function getUserClient({ provider, signer, contractAddress, abi }){
  const canUseContract = provider && signer && hasRealContract(contractAddress, abi)
  const contract = canUseContract ? new Contract(contractAddress, abi, signer) : null

  return {
    async getUser(address){
      const addr = address?.toLowerCase?.()
      if(!addr) throw new Error('Invalid address')

      if(contract){
        // 依据你未来的 ABI 返回结构做适配
        // 这里假设 getUser(address) 返回 [nickname, gender, age, exists]
        const result = await contract.getUser(addr)
        const [nickname, gender, age, exists] = result
        if(!exists){
          const err = new Error('NOT_FOUND')
          err.code = 'NOT_FOUND'
          throw err
        }
        return { nickname, gender, age: Number(age), exists }
      }

      // 本地存储模拟
      const raw = localStorage.getItem(lsKey(addr))
      if(!raw){
        const err = new Error('NOT_FOUND')
        err.code = 'NOT_FOUND'
        throw err
      }
      return JSON.parse(raw)
    },

    async createUser({ nickname, gender, age }){
      if(!nickname) throw new Error('缺少昵称')
      const normalizedAge = Number(age)

      if(contract){
        const tx = await contract.createUser(nickname, gender || '', normalizedAge)
        await tx.wait()
        return true
      }

      // 本地存储模拟
      const addr = (await signer.getAddress()).toLowerCase()
      const user = { nickname, gender: gender || '', age: normalizedAge, exists: true }
      localStorage.setItem(lsKey(addr), JSON.stringify(user))
      return true
    }
  }
}
