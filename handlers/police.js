// handlers/police.js
const { getPlayer, savePlayer, addExp } = require('../utils/db')

async function showWanted(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  const message = `👮 *Розыск*\n\nТекущий уровень розыска: ${player.wanted || 0}%\n`
  await ctx.reply(message, { parse_mode: 'Markdown' })
}

async function bribe(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const wanted = player.wanted || 0
  
  if (wanted === 0) {
    await ctx.reply('👮 *Полиция вас не ищет!*', { parse_mode: 'Markdown' })
    return
  }
  
  const price = wanted * 200
  
  if (player.balance < price) {
    await ctx.reply(`❌ *Не хватает денег на взятку!*\nНужно: $${price}, есть: $${player.balance}`, { parse_mode: 'Markdown' })
    return
  }
  
  savePlayer(userId, {
    balance: player.balance - price,
    wanted: 0,
    totalBribes: (player.totalBribes || 0) + 1
  })
  
  await ctx.reply(`✅ *Взятка дана!*\n💰 -$${price}\n👮 Розыск сброшен.`, { parse_mode: 'Markdown' })
}

async function raid(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if ((player.wanted || 0) < 100) {
    await ctx.reply('👮 *Розыск недостаточно высок для рейда!*', { parse_mode: 'Markdown' })
    return
  }
  
  // Потеря товара
  const inventory = player.inventory || {}
  const lossMultiplier = 0.5
  let lostGrams = 0
  const newInventory = {}
  
  for (const [drug, grams] of Object.entries(inventory)) {
    const loss = Math.floor(grams * lossMultiplier)
    if (loss > 0) {
      lostGrams += loss
      const remaining = grams - loss
      if (remaining > 0) newInventory[drug] = remaining
    } else {
      newInventory[drug] = grams
    }
  }
  
  // Штраф
  const fine = 5000
  const newBalance = Math.max(0, (player.balance || 0) - fine)
  
  // Блокировка на 30 минут
  const blockUntil = Date.now() + 30 * 60 * 1000
  
  savePlayer(userId, {
    inventory: newInventory,
    balance: newBalance,
    wanted: 0,
    blockUntil: blockUntil,
    totalRaids: (player.totalRaids || 0) + 1
  })
  
  await ctx.reply(`🚨 *ПОЛИЦЕЙСКИЙ РЕЙД!* 🚨\n\nПотеряно: ${lostGrams}г товара\nШтраф: $${fine}\n\n🔒 *Игра заблокирована на 30 минут!*`, { parse_mode: 'Markdown' })
}

module.exports = { showWanted, bribe, raid }