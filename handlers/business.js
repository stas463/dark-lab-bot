// handlers/business.js
const { getPlayer, savePlayer } = require('../utils/db')

const BUSINESSES = [
  { id: 'carwash', name: '🧼 Автомойка', price: 5000, profit: 70 },
  { id: 'laundry', name: '👕 Прачечная', price: 10000, profit: 75 },
  { id: 'nightclub', name: '🎵 Ночной клуб', price: 25000, profit: 85 },
  { id: 'casino', name: '🎰 Казино', price: 50000, profit: 90 },
  { id: 'bank', name: '🏦 Банк', price: 100000, profit: 95 }
]

async function showBusiness(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  let message = `🏢 *БИЗНЕС*\n\n`
  
  if (player.business) {
    const biz = BUSINESSES.find(b => b.id === player.business)
    message += `✅ *ТВОЙ БИЗНЕС:* ${biz.name}\n`
    message += `💰 ОТМЫВАЕТ ${biz.profit}% ДЕНЕГ\n`
    message += `📊 ЛИМИТ ОТМЫВА ЗА РАЗ: $${biz.price * 2}\n\n`
    message += `📌 *КАК РАБОТАЕТ:*\nПри продаже наркотиков деньги автоматически отмываются через бизнес.`
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 ПРОДАТЬ БИЗНЕС (50% возврат)', callback_data: 'biz_sell' }],
          [{ text: '❌ ЗАКРЫТЬ', callback_data: 'biz_close' }]
        ]
      }
    }
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
    }
  } else {
    message += `У ТЕБЯ НЕТ БИЗНЕСА. КУПИ ОДИН:\n\n`
    
    const buyButtons = []
    for (let i = 0; i < BUSINESSES.length; i++) {
      const biz = BUSINESSES[i]
      buyButtons.push([{ text: `${biz.name} — $${biz.price}`, callback_data: `biz_buy_${biz.id}` }])
    }
    buyButtons.push([{ text: '❌ ЗАКРЫТЬ', callback_data: 'biz_close' }])
    
    const keyboard = { reply_markup: { inline_keyboard: buyButtons } }
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
    }
  }
}

async function handleBusinessBuy(ctx, bizId) {
  const userId = ctx.from.id.toString()
  
  console.log('handleBusinessBuy вызван, bizId:', bizId)
  
  if (bizId === 'close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (bizId === 'sell') {
    await handleBusinessSell(ctx)
    return
  }
  
  const biz = BUSINESSES.find(b => b.id === bizId)
  if (!biz) {
    await ctx.answerCbQuery(`❌ БИЗНЕС НЕ НАЙДЕН!`)
    return
  }
  
  const player = getPlayer(userId)
  
  if (player.balance < biz.price) {
    await ctx.answerCbQuery(`❌ НЕ ХВАТАЕТ ДЕНЕГ!\n💰 НУЖНО: $${biz.price}\n💰 ЕСТЬ: $${player.balance}`)
    return
  }
  
  const stats = player.achievementStats || {}
  stats.business_count = (stats.business_count || 0) + 1
  if (biz.id === 'bank') {
    stats.business_bank = (stats.business_bank || 0) + 1
  }
  
  savePlayer(userId, {
    balance: player.balance - biz.price,
    business: bizId,
    achievementStats: stats
  })
  
  await ctx.answerCbQuery(`✅ БИЗНЕС КУПЛЕН!`)
  await ctx.editMessageText(`✅ *БИЗНЕС КУПЛЕН!*\n🏢 ${biz.name}\n💰 ОСТАТОК: $${player.balance - biz.price}\n\n📊 *СТАТИСТИКА БИЗНЕСА:*\n• ОТМЫВАЕТ ${biz.profit}% ДЕНЕГ\n• ЛИМИТ ОТМЫВА ЗА РАЗ: $${biz.price * 2}\n\nТЕПЕРЬ ПРИ ПРОДАЖЕ ДЕНЬГИ БУДУТ ОТМЫВАТЬСЯ АВТОМАТИЧЕСКИ!`, { parse_mode: 'Markdown' })
}

async function handleBusinessSell(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if (!player.business) {
    await ctx.answerCbQuery('❌ У ВАС НЕТ БИЗНЕСА ДЛЯ ПРОДАЖИ!')
    return
  }
  
  const biz = BUSINESSES.find(b => b.id === player.business)
  if (!biz) return
  
  const возврат = Math.floor(biz.price * 0.5)
  
  savePlayer(userId, {
    balance: player.balance + возврат,
    business: null
  })
  
  await ctx.answerCbQuery(`✅ БИЗНЕС ПРОДАН!`)
  await ctx.editMessageText(`✅ *БИЗНЕС ПРОДАН!*\n🏢 ${biz.name}\n💰 ПОЛУЧЕНО: $${возврат} (50% ОТ СТОИМОСТИ)\n💵 НОВЫЙ БАЛАНС: $${player.balance + возврат}`, { parse_mode: 'Markdown' })
}

module.exports = { showBusiness, handleBusinessBuy }