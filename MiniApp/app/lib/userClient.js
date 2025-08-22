import { Contract } from 'ethers'
/**
 * UserAttr structure from smart contract:
 * {
 *   bool registered;
 *   string profileCid; // 病例Cid
 *   string chatCid; // 聊天Cid
 *   uint256[] tokenIds;
 *   uint32 totalDays; // 总天数
 *   uint32 streakDays; // 连续天数
 *   uint64 lastDayIndex; // day index = timestamp / 1 days
 * }
 */

function hasRealContract(contractAddress, abi){
  return contractAddress && Array.isArray(abi) && abi.length > 0
}

function lsKey(addr){
  return `user:${addr?.toLowerCase?.()}`
}

/**
 * Parse user data from contract result
 * Contract getUser returns: (bool,string,string,uint32,uint32,uint64,uint256)
 * Maps to: registered, profileCid, chatCid, totalDays, streakDays, lastDayIndex, tokenCount
 */
function parseUserFromContract(result) {
  const [registered, profileCid, chatCid, totalDays, streakDays, lastDayIndex, tokenCount] = result
  return {
    registered: Boolean(registered),
    profileCid: profileCid || '',
    chatCid: chatCid || '',
    totalDays: Number(totalDays),
    streakDays: Number(streakDays),
    lastDayIndex: Number(lastDayIndex),
    tokenCount: Number(tokenCount),
    tokenIds: [] // Will be fetched separately if needed
  }
}

/**
 * Save user data to localStorage
 */
function saveUserLocally(address, userData) {
  const addr = address?.toLowerCase?.()
  if (!addr) throw new Error('Invalid address')
  
  const key = lsKey(addr)
  const dataToSave = {
    ...userData,
    lastUpdated: Date.now(),
    address: addr
  }
  
  localStorage.setItem(key, JSON.stringify(dataToSave))
  console.log(`User data saved locally for ${addr}`)
}

/**
 * Get user data from localStorage
 */
function getUserLocally(address) {
  const addr = address?.toLowerCase?.()
  if (!addr) return null
  
  const raw = localStorage.getItem(lsKey(addr))
  if (!raw) return null
  
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse local user data:', e)
    return null
  }
}

export function getUserClient({ provider, signer, contractAddress, abi }){
  const canUseContract = provider && signer && hasRealContract(contractAddress, abi)
  const contract = canUseContract ? new Contract(contractAddress, abi, signer) : null

  return {
    /**
     * Get user information from contract and save locally
     */
    async getUser(address){
      const addr = address?.toLowerCase?.()
      if(!addr) throw new Error('Invalid address')

      if(contract){
        try {
          // Call contract getUser function
          const result = await contract.getUser(addr)
          const userData = parseUserFromContract(result)
          
          if(!userData.registered){
            const err = new Error('User not registered')
            err.code = 'NOT_FOUND'
            throw err
          }

          // Get user token IDs if registered
          try {
            const tokenIds = await contract.userTokens(addr)
            userData.tokenIds = tokenIds.map(id => Number(id))
          } catch (e) {
            console.warn('Failed to fetch user tokens:', e)
            userData.tokenIds = []
          }

          // Save to localStorage
          saveUserLocally(addr, userData)
          
          return userData
        } catch (e) {
          if (e.code === 'NOT_FOUND') throw e
          console.error('Contract call failed:', e)
          
          // Fallback to local storage
          const localData = getUserLocally(addr)
          if (localData) {
            console.log('Using cached user data')
            return localData
          }
          throw e
        }
      }

      // Local storage only mode
      const localData = getUserLocally(addr)
      if(!localData){
        const err = new Error('User not found')
        err.code = 'NOT_FOUND'
        throw err
      }
      return localData
    },

    /**
     * Register new user
     */
    async createUser(userData = {}){
      const addr = signer ? (await signer.getAddress()).toLowerCase() : null
      if (!addr) throw new Error('Wallet not connected')

      if(contract){
        try {
          // Call contract register function
          const tx = await contract.register()
          await tx.wait()
          
          // Create initial user data structure
          const initialUserData = {
            registered: true,
            profileCid: '',
            chatCid: '',
            totalDays: 0,
            streakDays: 0,
            lastDayIndex: 0,
            tokenIds: [],
            tokenCount: 0,
            ...userData
          }
          
          // Save to localStorage
          saveUserLocally(addr, initialUserData)
          
          return initialUserData
        } catch (e) {
          console.error('Registration failed:', e)
          throw new Error(`Registration failed: ${e.message}`)
        }
      }

      // Local storage simulation
      const simulatedUserData = {
        registered: true,
        profileCid: '',
        chatCid: '',
        totalDays: 0,
        streakDays: 0,
        lastDayIndex: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
        tokenIds: [],
        tokenCount: 0,
        ...userData
      }
      
      saveUserLocally(addr, simulatedUserData)
      return simulatedUserData
    },

    /**
     * Update user profile and chat CIDs
     */
    async updateUser(profileCid = '', chatCid = '') {
      const addr = signer ? (await signer.getAddress()).toLowerCase() : null
      if (!addr) throw new Error('Wallet not connected')

      if(contract){
        try {
          const tx = await contract.updateUser(profileCid, chatCid)
          await tx.wait()
          
          // Update local data
          const localData = getUserLocally(addr) || {}
          const updatedData = {
            ...localData,
            profileCid,
            chatCid,
            lastUpdated: Date.now()
          }
          
          saveUserLocally(addr, updatedData)
          return updatedData
        } catch (e) {
          console.error('Update user failed:', e)
          throw new Error(`Update failed: ${e.message}`)
        }
      }

      // Local storage simulation
      const localData = getUserLocally(addr) || {}
      const updatedData = {
        ...localData,
        profileCid,
        chatCid,
        lastUpdated: Date.now()
      }
      
      saveUserLocally(addr, updatedData)
      return updatedData
    },

    /**
     * Check in (daily activity)
     */
    async checkIn() {
      const addr = signer ? (await signer.getAddress()).toLowerCase() : null
      if (!addr) throw new Error('Wallet not connected')

      if(contract){
        try {
          const tx = await contract.checkIn()
          await tx.wait()
          
          // Refresh user data after check-in
          return await this.getUser(addr)
        } catch (e) {
          console.error('Check-in failed:', e)
          throw new Error(`Check-in failed: ${e.message}`)
        }
      }

      // Local storage simulation
      const localData = getUserLocally(addr) || {}
      const currentDayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
      
      const updatedData = {
        ...localData,
        totalDays: (localData.totalDays || 0) + 1,
        streakDays: (localData.lastDayIndex === currentDayIndex - 1) 
          ? (localData.streakDays || 0) + 1 
          : 1,
        lastDayIndex: currentDayIndex,
        lastUpdated: Date.now()
      }
      
      saveUserLocally(addr, updatedData)
      return updatedData
    },

    /**
     * Get user tokens
     */
    async getUserTokens(address) {
      const addr = address?.toLowerCase?.()
      if(!addr) throw new Error('Invalid address')

      if(contract){
        try {
          const tokenIds = await contract.userTokens(addr)
          return tokenIds.map(id => Number(id))
        } catch (e) {
          console.error('Failed to fetch user tokens:', e)
          return []
        }
      }

      // Return from local data
      const localData = getUserLocally(addr)
      return localData?.tokenIds || []
    },

    // Utility functions
    saveUserLocally,
    getUserLocally
  }
}
