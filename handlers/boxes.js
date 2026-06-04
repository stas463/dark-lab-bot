// handlers/boxes.js
const { getPlayer, savePlayer } = require('../utils/db')

const BOXES = {
  common: { name: '📦 Обычный бокс', price: 10, icon: '🟢' },
  rare: { name: '🔵 Редкий бокс', price: 50, icon: '🔵' },
  epic: { name: '🟣 Эпический бокс', price: 200, icon: '🟣' },
  legendary: { name: '🟠 Легендарный бокс', price: 500, icon: '🟠' },
  mythic: { name: '🔴 Мифический бокс', price: 1000, icon: '🔴' }
}

async function showBoxes(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📦 Обычный бокс (10💎)', callback_data: 'box_common' }],
        [{ text: '🔵 Редкий бокс (50💎)', callback_data: 'box_rare' }],
        [{ text: '🟣 Эпический бокс (200💎)', callback_data: 'box_epic' }],
        [{ text: '🟠 Легендарный бокс (500💎)', callback_data: 'box_legendary' }],
        [{ text: '🔴 Мифический бокс (1000💎)', callback_data: 'box_mythic' }],
        [{ text: '❌ Отмена', callback_data: 'box_cancel' }]
      ]
    }
  }
  await ctx.reply('📦 *Выбери бокс для открытия:*\n💎 Осколки падают с шансом 5% при варке', { parse_mode: 'Markdown', ...keyboard })
}

async function handleBox(ctx, boxType) {
  const userId = ctx.from.id.toString()
  
  if (boxType === 'cancel') {
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌ Открытие отменено.')
    return
  }
  
  const box = BOXES[boxType]
  if (!box) return
  
  const player = getPlayer(userId)
  
  if (player.shards < box.price) {
    await ctx.answerCbQuery(`❌ Не хватает осколков! Нужно: ${box.price}, есть: ${player.shards}`)
    return
  }
  
  // Шансы выпадения
  const rand = Math.random()
  let rarity = 'common'
  let glyphName = ''
  
  if (boxType === 'common') {
    if (rand < 0.85) rarity = 'common'
    else if (rand < 0.97) rarity = 'rare'
    else rarity = 'epic'
  } else if (boxType === 'rare') {
    if (rand < 0.55) rarity = 'common'
    else if (rand < 0.90) rarity = 'rare'
    else if (rand < 0.99) rarity = 'epic'
    else rarity = 'legendary'
  } else if (boxType === 'epic') {
    if (rand < 0.40) rarity = 'common'
    else if (rand < 0.75) rarity = 'rare'
    else if (rand < 0.93) rarity = 'epic'
    else if (rand < 0.99) rarity = 'legendary'
    else rarity = 'mythic'
  } else if (boxType === 'legendary') {
    if (rand < 0.20) rarity = 'common'
    else if (rand < 0.50) rarity = 'rare'
    else if (rand < 0.80) rarity = 'epic'
    else if (rand < 0.98) rarity = 'legendary'
    else rarity = 'mythic'
  } else {
    if (rand < 0.25) rarity = 'epic'
    else if (rand < 0.85) rarity = 'legendary'
    else rarity = 'mythic'
  }
  
  const rarityNames = { common: '🟢 Обычный', rare: '🔵 Редкий', epic: '🟣 Эпический', legendary: '🟠 Легендарный', mythic: '🔴 Мифический' }
  glyphName = `Глиф ${rarityNames[rarity]} #${Math.floor(Math.random() * 1000)}`
  
  savePlayer(userId, { shards: player.shards - box.price })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`🎁 *Бокс открыт!*\n📦 Тип: ${box.name}\n✨ Выпал: ${glyphName}\n💎 Осталось осколков: ${player.shards - box.price}`, { parse_mode: 'Markdown' })
}

module.exports = { showBoxes, handleBox }