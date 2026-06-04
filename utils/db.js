// utils/db.js
const { Redis } = require('@upstash/redis')

const redis = Redis.fromEnv()
const PREFIX = 'darklab:'

function getUserKey(userId) {
  return `${PREFIX}user:${userId}`
}

async function getPlayer(userId, name = null) {
  const key = getUserKey(userId)
  let player = await redis.get(key)
  
  if (!player) {
    player = {
      name: name || userId,
      balance: 1500,
      level: 1,
      exp: 0,
      shards: 0,
      wanted: 0,
      business: null,
      activeCar: 'walk',
      cars: ['walk'],
      inventory: {},
      upgrades: {},
      equipment: {},
      glyphs: [],
      achievements: [],
      lastDaily: null,
      referralCode: null,
      referredBy: null,
      referrals: [],
      totalBribes: 0,
      totalRaids: 0,
      protectionAmulets: 0,
      questsProgress: {},
      questsClaimed: {},
      lastQuestReset: null,
      carsState: {},
      blockUntil: null,
      achievementStats: {},
      createdAt: Date.now()
    }
    await redis.set(key, JSON.stringify(player))
  } else if (typeof player === 'string') {
    player = JSON.parse(player)
  }
  
  if (name && player.name !== name) {
    player.name = name
    await redis.set(key, JSON.stringify(player))
  }
  
  return player
}

async function savePlayer(userId, data) {
  const key = getUserKey(userId)
  const player = await getPlayer(userId)
  const updated = { ...player, ...data }
  await redis.set(key, JSON.stringify(updated))
  return updated
}

async function addExp(userId, amount) {
  const player = await getPlayer(userId)
  let newExp = (player.exp || 0) + amount
  let newLevel = player.level || 1
  let leveledUp = false
  
  const expNeeded = newLevel * 500
  while (newExp >= expNeeded) {
    newExp -= expNeeded
    newLevel++
    leveledUp = true
  }
  
  await savePlayer(userId, { exp: newExp, level: newLevel })
  return leveledUp
}

async function getAllPlayers() {
  const keys = await redis.keys(`${PREFIX}user:*`)
  const players = []
  for (const key of keys) {
    const data = await redis.get(key)
    if (data) {
      players.push(typeof data === 'string' ? JSON.parse(data) : data)
    }
  }
  return players
}

module.exports = { getPlayer, savePlayer, addExp, getAllPlayers }