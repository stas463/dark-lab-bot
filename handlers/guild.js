// handlers/guild.js
const { getPlayer, savePlayer } = require('../utils/db')

async function showGuild(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const guild = player.guild
  
  if (!guild) {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✨ Создать гильдию (100000$)', callback_data: 'guild_create' }],
          [{ text: '❌ Закрыть', callback_data: 'guild_close' }]
        ]
      }
    }
    await ctx.reply('🏆 *Гильдии*\n\nТы не состоишь в гильдии.\nСоздай свою!', { parse_mode: 'Markdown', ...keyboard })
    return
  }
  
  let message = `🏆 *Гильдия: ${guild.name}*\n\n`
  message += `👑 Лидер: ${guild.leader}\n`
  message += `👥 Участников: ${guild.members?.length || 1}\n`
  message += `📊 Уровень: ${guild.level || 1}\n\n`
  message += `• /guild_leave — покинуть гильдию`
  
  await ctx.reply(message, { parse_mode: 'Markdown' })
}

async function handleGuild(ctx, action) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if (action === 'close') {
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌ Меню закрыто.')
    return
  }
  
  if (action === 'create') {
    if (player.guild) {
      await ctx.answerCbQuery('❌ Ты уже в гильдии!')
      return
    }
    
    if (player.balance < 100000) {
      await ctx.answerCbQuery(`❌ Не хватает денег! Нужно: $100000`)
      return
    }
    
    savePlayer(userId, {
      balance: player.balance - 100000,
      guild: { name: `Гильдия ${ctx.from.first_name}`, leader: ctx.from.first_name, members: [userId], level: 1 }
    })
    
    await ctx.answerCbQuery()
    await ctx.editMessageText(`✅ *Гильдия создана!*\n🏆 Название: Гильдия ${ctx.from.first_name}\n💰 Остаток: $${player.balance - 100000}`, { parse_mode: 'Markdown' })
  }
}

module.exports = { showGuild, handleGuild }