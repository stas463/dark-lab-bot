// handlers/daily.js
const { getPlayer, savePlayer } = require('../utils/db')

async function showDaily(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const lastDaily = player.lastDaily || 0
  const now = Date.now()
  const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - lastDaily)) / (60 * 60 * 1000))
  
  if (lastDaily && now - lastDaily < 24 * 60 * 60 * 1000) {
    await ctx.reply(`🎁 *Ежедневный бонус*\n\nТы уже получил сегодняшний бонус!\nСледующий бонус через ${hoursLeft} часов.\n\n💰 Бонус: $1000\n💎 Осколки: +1`, { parse_mode: 'Markdown' })
    return
  }
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎁 Забрать бонус', callback_data: 'daily_claim' }]
      ]
    }
  }
  
  await ctx.reply(`🎁 *Ежедневный бонус*\n\nТы можешь получить:\n💰 +$1000\n💎 +1 осколок\n\nНажми на кнопку, чтобы забрать!`, { parse_mode: 'Markdown', ...keyboard })
}

async function claimDaily(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const now = Date.now()
  const lastDaily = player.lastDaily || 0
  
  if (lastDaily && now - lastDaily < 24 * 60 * 60 * 1000) {
    await ctx.answerCbQuery('❌ Ты уже получил сегодняшний бонус!')
    return
  }
  
  savePlayer(userId, {
    balance: player.balance + 1000,
    shards: (player.shards || 0) + 1,
    lastDaily: now
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`🎁 *Бонус получен!*\n💰 +$1000\n💎 +1 осколок\n\nПриходи завтра снова!`, { parse_mode: 'Markdown' })
}

module.exports = { showDaily, claimDaily }