// handlers/sell.js
const { getPlayer, savePlayer } = require('../utils/db')

const RECIPES = {
  krokodil: { name: '🐊 Крокодил', price: 250 },
  marijuana: { name: '🌿 Марихуана', price: 70 },
  pcp: { name: '👻 PCP', price: 120 },
  amphetamine: { name: '⚡ Амфетамин', price: 180 },
  meth: { name: '❄️ Мет', price: 300 },
  mdma: { name: '💊 MDMA', price: 350 },
  heroin: { name: '💉 Героин', price: 500 },
  cocaine: { name: '⬜ Кокаин', price: 700 },
  blue_meth: { name: '💎 Голубой Мет', price: 1000 },
  lsd: { name: '🧪 ЛСД', price: 1500 }
}

async function showSellMenu(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  
  const drugs = []
  for (const [drug, grams] of Object.entries(inventory)) {
    const recipe = RECIPES[drug]
    if (recipe && grams > 0) {
      drugs.push([{ text: `${recipe.name} (${grams}г) — $${recipe.price}/г`, callback_data: `sell_${drug}` }])
    }
  }
  
  if (drugs.length === 0) {
    await ctx.reply('❌ *У тебя нет наркотиков для продажи!\n\nСначала свари их через /craft*', { parse_mode: 'Markdown' })
    return
  }
  
  drugs.push([{ text: '❌ Отмена', callback_data: 'sell_cancel' }])
  
  const keyboard = { reply_markup: { inline_keyboard: drugs } }
  await ctx.reply('💰 *Что будем продавать?*', { parse_mode: 'Markdown', ...keyboard })
}

async function handleSell(ctx, drugKey) {
  const userId = ctx.from.id.toString()
  
  if (drugKey === 'cancel') {
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌ Продажа отменена.')
    return
  }
  
  const player = getPlayer(userId)
  const recipe = RECIPES[drugKey]
  const grams = player.inventory?.[drugKey] || 0
  
  if (grams === 0) {
    await ctx.answerCbQuery('❌ У вас нет этого наркотика')
    return
  }
  
  const price = recipe.price // ИСПРАВЛЕНО: теперь цена из рецепта
  const revenue = grams * price
  
  const newInventory = { ...player.inventory }
  delete newInventory[drugKey]
  
  savePlayer(userId, {
    balance: player.balance + revenue,
    inventory: newInventory
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`✅ *Продажа завершена!*\n📦 Продано: ${grams}г ${recipe.name}\n💰 Выручка: $${revenue}`, { parse_mode: 'Markdown' })
}

module.exports = { showSellMenu, handleSell }