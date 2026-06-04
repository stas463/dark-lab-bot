// handlers/shardshop.js
const { getPlayer, savePlayer } = require('../utils/db')

async function showShardShop(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  const items = [
    { id: 'amulet', name: '🛡️ Амулет защиты', price: 100, desc: 'Спасает оборудование от сгорания при скрещивании' },
    { id: 'glyph_random', name: '🎲 Случайный глиф', price: 50, desc: 'Получи случайный глиф (обычный→мифический)' }
  ]
  
  let message = `💎 *Магазин осколков*\n💰 У тебя: ${player.shards} осколков\n\n`
  
  const buttons = []
  for (const item of items) {
    message += `• *${item.name}* — ${item.price}💎\n   ${item.desc}\n\n`
    buttons.push([{ text: `Купить ${item.name} за ${item.price}💎`, callback_data: `shard_buy_${item.id}` }])
  }
  buttons.push([{ text: '❌ Закрыть', callback_data: 'shard_close' }])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
}

async function handleShardBuy(ctx, itemId) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  const prices = { amulet: 100, glyph_random: 50 }
  const price = prices[itemId]
  
  if (player.shards < price) {
    await ctx.answerCbQuery(`❌ Не хватает осколков! Нужно: ${price}, есть: ${player.shards}`)
    return
  }
  
  if (itemId === 'amulet') {
    savePlayer(userId, { 
      shards: player.shards - price,
      protectionAmulets: (player.protectionAmulets || 0) + 1
    })
    await ctx.answerCbQuery()
    await ctx.editMessageText(`✅ *Куплен Амулет защиты!*\n💎 Осталось осколков: ${player.shards - price}\n🛡️ Теперь у тебя ${(player.protectionAmulets || 0) + 1} амулетов.`, { parse_mode: 'Markdown' })
  } else if (itemId === 'glyph_random') {
    const glyphs = ['🟢 Обычный', '🔵 Редкий', '🟣 Эпический', '🟠 Легендарный', '🔴 Мифический']
    const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic']
    const rand = Math.random()
    let glyph = glyphs[0]
    let rarity = rarities[0]
    if (rand < 0.5) { glyph = glyphs[0]; rarity = rarities[0] }
    else if (rand < 0.75) { glyph = glyphs[1]; rarity = rarities[1] }
    else if (rand < 0.9) { glyph = glyphs[2]; rarity = rarities[2] }
    else if (rand < 0.98) { glyph = glyphs[3]; rarity = rarities[3] }
    else { glyph = glyphs[4]; rarity = rarities[4] }
    
    savePlayer(userId, { shards: player.shards - price })
    await ctx.answerCbQuery()
    await ctx.editMessageText(`🎁 *Ты получил глиф!*\n✨ Редкость: ${glyph}\n💎 Осталось осколков: ${player.shards - price}`, { parse_mode: 'Markdown' })
  }
}

module.exports = { showShardShop, handleShardBuy }