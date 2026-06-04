// handlers/profile.js
const { getPlayer } = require('../utils/db')

async function showProfile(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  await ctx.reply(`
👤 *Профиль*

Имя: ${ctx.from.first_name}
💰 Баланс: $${player.balance}
⭐ Уровень: ${player.level}
📊 Опыт: ${player.exp}/${player.level * 500}
💎 Осколки: ${player.shards}
👮 Розыск: ${player.wanted}%
🚗 Машина: ${player.activeCar}
🏢 Бизнес: ${player.business || 'нет'}

📌 *Команды:*
/help — список всех команд
  `, { parse_mode: 'Markdown' })
}

module.exports = { showProfile }