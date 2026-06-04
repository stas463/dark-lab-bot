// handlers/referrals.js
const { getPlayer, savePlayer } = require('../utils/db')

async function showReferrals(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  let code = player.referralCode
  if (!code) {
    code = userId.slice(-6)
    savePlayer(userId, { referralCode: code })
  }
  
  const botUsername = ctx.botInfo.username
  const link = `https://t.me/${botUsername}?start=ref_${code}`
  
  let message = `👥 *Реферальная система*\n\n`
  message += `Твоя ссылка: ${link}\n`
  message += `Приглашено друзей: ${player.referrals?.length || 0}\n`
  message += `За каждого друга ты получишь 5000$ и 1 осколок!\n\n`
  message += `📌 *Бонусы:*\n`
  message += `• 1 друг: +5000$\n`
  message += `• 5 друзей: +25000$ + 5 осколков\n`
  message += `• 10 друзей: +50000$ + 10 осколков + звание "Лидер"`
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Копировать ссылку', callback_data: 'ref_copy' }],
        [{ text: '🎁 Забрать бонус', callback_data: 'ref_claim' }],
        [{ text: '❌ Закрыть', callback_data: 'ref_close' }]
      ]
    }
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
}

async function claimReferralReward(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const referralsCount = player.referrals?.length || 0
  
  if (referralsCount === 0) {
    await ctx.answerCbQuery('❌ У вас нет приглашённых друзей!')
    return
  }
  
  let reward = 0
  let shardReward = 0
  
  if (referralsCount >= 10) {
    reward = 50000
    shardReward = 10
  } else if (referralsCount >= 5) {
    reward = 25000
    shardReward = 5
  } else {
    reward = referralsCount * 5000
    shardReward = referralsCount
  }
  
  savePlayer(userId, {
    balance: player.balance + reward,
    shards: (player.shards || 0) + shardReward
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`🎉 *Бонус получен!*\n💰 +$${reward}\n💎 +${shardReward} осколков`, { parse_mode: 'Markdown' })
}

module.exports = { showReferrals, claimReferralReward }