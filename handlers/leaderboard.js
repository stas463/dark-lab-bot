// handlers/leaderboard.js
const fs = require('fs')
const path = require('path')

// Путь к файлу с данными
const DB_FILE = path.join(__dirname, '../database.json')

// Получить всех игроков из базы
function getAllPlayers() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8')
      const parsed = JSON.parse(data)
      return parsed
    }
  } catch (e) {
    console.error('Ошибка загрузки топа:', e)
  }
  return {}
}

// Форматирование числа с разделителями
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

async function showLeaderboard(ctx) {
  const players = getAllPlayers()
  
  // Преобразуем в массив для сортировки
  let playersList = []
  for (const [userId, data] of Object.entries(players)) {
    playersList.push({
      userId,
      name: data.name || userId,
      balance: data.balance || 0,
      level: data.level || 1,
      exp: data.exp || 0,
      shards: data.shards || 0,
      wanted: data.wanted || 0,
      cars: data.cars?.length || 1,
      business: data.business ? 1 : 0
    })
  }
  
  if (playersList.length === 0) {
    await ctx.reply('🏆 *ТОП ИГРОКОВ*\n\nПока нет игроков! Будь первым! 🎉', { parse_mode: 'Markdown' })
    return
  }
  
  // Создаем кнопки для выбора категории
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💰 ПО БАЛАНСУ', callback_data: 'top_balance' }],
        [{ text: '⭐ ПО УРОВНЮ', callback_data: 'top_level' }],
        [{ text: '💎 ПО ОСКОЛКАМ', callback_data: 'top_shards' }],
        [{ text: '🚗 ПО МАШИНАМ', callback_data: 'top_cars' }],
        [{ text: '🏢 ПО БИЗНЕСУ', callback_data: 'top_business' }],
        [{ text: '👮 ПО РОЗЫСКУ', callback_data: 'top_wanted' }],
        [{ text: '❌ ЗАКРЫТЬ', callback_data: 'top_close' }]
      ]
    }
  }
  
  await ctx.reply('🏆 *ТОП ИГРОКОВ*\n\nВыбери категорию для отображения:', { parse_mode: 'Markdown', ...keyboard })
}

async function showTopByCategory(ctx, category) {
  const players = getAllPlayers()
  
  let playersList = []
  for (const [userId, data] of Object.entries(players)) {
    let value = 0
    let unit = ''
    
    switch (category) {
      case 'balance':
        value = data.balance || 0
        unit = '$'
        break
      case 'level':
        value = data.level || 1
        unit = '⭐'
        break
      case 'shards':
        value = data.shards || 0
        unit = '💎'
        break
      case 'cars':
        value = data.cars?.length || 1
        unit = '🚗'
        break
      case 'business':
        value = data.business ? 1 : 0
        unit = '🏢'
        break
      case 'wanted':
        value = data.wanted || 0
        unit = '👮'
        break
      default:
        value = data.balance || 0
        unit = '$'
    }
    
    playersList.push({
      userId,
      name: data.name || userId,
      value: value,
      unit: unit,
      level: data.level || 1,
      balance: data.balance || 0
    })
  }
  
  // Сортируем по убыванию
  playersList.sort((a, b) => b.value - a.value)
  
  // Берем топ-10
  const top10 = playersList.slice(0, 10)
  
  let title = ''
  switch (category) {
    case 'balance': title = '💰 БАЛАНС'; break
    case 'level': title = '⭐ УРОВЕНЬ'; break
    case 'shards': title = '💎 ОСКОЛКИ'; break
    case 'cars': title = '🚗 МАШИНЫ'; break
    case 'business': title = '🏢 БИЗНЕС'; break
    case 'wanted': title = '👮 РОЗЫСК'; break
    default: title = 'ТОП'
  }
  
  let message = `🏆 *ТОП ИГРОКОВ — ${title}* 🏆\n\n`
  
  for (let i = 0; i < top10.length; i++) {
    const player = top10[i]
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
    let displayName = player.name.length > 20 ? player.name.slice(0, 18) + '...' : player.name
    
    if (category === 'balance') {
      message += `${medal} *${displayName}* — ${player.unit}${formatNumber(player.value)} (⭐${player.level})\n`
    } else if (category === 'level') {
      message += `${medal} *${displayName}* — ${player.unit}${player.value} (💰$${formatNumber(player.balance)})\n`
    } else if (category === 'business') {
      const hasBusiness = player.value === 1 ? '✅ Есть' : '❌ Нет'
      message += `${medal} *${displayName}* — ${hasBusiness}\n`
    } else {
      message += `${medal} *${displayName}* — ${player.unit}${formatNumber(player.value)}\n`
    }
  }
  
  if (top10.length === 0) {
    message += `Пока нет данных...\n`
  }
  
  // Добавляем позицию текущего игрока
  const userId = ctx.from.id.toString()
  const currentPlayer = playersList.find(p => p.userId === userId)
  if (currentPlayer) {
    const currentRank = playersList.findIndex(p => p.userId === userId) + 1
    message += `\n📊 *ТВОЯ ПОЗИЦИЯ:* ${currentRank} место`
    if (category === 'balance') {
      message += `\n💰 Баланс: $${formatNumber(currentPlayer.value)}`
    } else if (category === 'level') {
      message += `\n⭐ Уровень: ${currentPlayer.value}`
    } else if (category === 'shards') {
      message += `\n💎 Осколки: ${formatNumber(currentPlayer.value)}`
    }
  }
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 НАЗАД', callback_data: 'top_back' }],
        [{ text: '❌ ЗАКРЫТЬ', callback_data: 'top_close' }]
      ]
    }
  }
  
  await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
}

async function handleLeaderboard(ctx, action) {
  if (action === 'top_back') {
    await showLeaderboard(ctx)
    return
  }
  
  if (action === 'top_close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (action === 'top_balance') {
    await showTopByCategory(ctx, 'balance')
    return
  }
  
  if (action === 'top_level') {
    await showTopByCategory(ctx, 'level')
    return
  }
  
  if (action === 'top_shards') {
    await showTopByCategory(ctx, 'shards')
    return
  }
  
  if (action === 'top_cars') {
    await showTopByCategory(ctx, 'cars')
    return
  }
  
  if (action === 'top_business') {
    await showTopByCategory(ctx, 'business')
    return
  }
  
  if (action === 'top_wanted') {
    await showTopByCategory(ctx, 'wanted')
    return
  }
  
  await showLeaderboard(ctx)
}

module.exports = { showLeaderboard, handleLeaderboard }