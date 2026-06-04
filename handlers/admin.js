// handlers/admin.js
const fs = require('fs')
const path = require('path')
const { getPlayer, savePlayer } = require('../utils/db')

// ТВОЙ ID (нужно узнать)
// Напиши боту /id, чтобы узнать свой ID
const ADMIN_ID = 6034090849 // ЗАМЕНИ НА СВОЙ ID ПОСЛЕ /id

const ADMIN_PASSWORD = 'uuuuuioo67'

// Временное хранилище для сессий админа
const adminSessions = new Map()

// Проверка админа
function isAdmin(userId) {
  return userId === ADMIN_ID
}

// Проверка пароля
async function checkAdminPassword(ctx, password) {
  if (password === ADMIN_PASSWORD) {
    const userId = ctx.from.id.toString()
    adminSessions.set(userId, true)
    setTimeout(() => adminSessions.delete(userId), 30 * 60 * 1000) // 30 минут
    return true
  }
  return false
}

// Получить всех игроков
function getAllPlayers() {
  const dbPath = path.join(__dirname, '../database.json')
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Ошибка загрузки:', e)
  }
  return {}
}

// Сохранить всех игроков
function saveAllPlayers(players) {
  const dbPath = path.join(__dirname, '../database.json')
  try {
    fs.writeFileSync(dbPath, JSON.stringify(players, null, 2), 'utf8')
  } catch (e) {
    console.error('Ошибка сохранения:', e)
  }
}

// Главное меню админки
async function showAdminMenu(ctx) {
  const userId = ctx.from.id.toString()
  
  if (!isAdmin(parseInt(userId))) {
    await ctx.reply('❌ *ДОСТУП ЗАПРЕЩЁН!*\n\nУ вас нет прав администратора.', { parse_mode: 'Markdown' })
    return
  }
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👥 СПИСОК ИГРОКОВ', callback_data: 'admin_list' }],
        [{ text: '💰 ВЫДАТЬ ДЕНЬГИ', callback_data: 'admin_give_money' }],
        [{ text: '💎 ВЫДАТЬ ОСКОЛКИ', callback_data: 'admin_give_shards' }],
        [{ text: '⭐ ВЫДАТЬ УРОВНИ', callback_data: 'admin_give_level' }],
        [{ text: '📦 ВЫДАТЬ НАРКОТИКИ', callback_data: 'admin_give_drugs' }],
        [{ text: '🔧 ВЫДАТЬ ОБОРУДОВАНИЕ', callback_data: 'admin_give_equipment' }],
        [{ text: '🚗 ВЫДАТЬ МАШИНЫ', callback_data: 'admin_give_cars' }],
        [{ text: '🏆 ВЫДАТЬ АЧИВКИ', callback_data: 'admin_give_achievements' }],
        [{ text: '🗑️ ОЧИСТИТЬ БАЗУ', callback_data: 'admin_clear_db' }],
        [{ text: '📊 СТАТИСТИКА', callback_data: 'admin_stats' }],
        [{ text: '❌ ЗАКРЫТЬ', callback_data: 'admin_close' }]
      ]
    }
  }
  
  await ctx.reply('👑 *АДМИН-ПАНЕЛЬ* 👑\n\nВыбери действие:', { parse_mode: 'Markdown', ...keyboard })
}

// Список игроков
async function showPlayersList(ctx, page = 0) {
  const players = getAllPlayers()
  const playersList = Object.entries(players).map(([id, data]) => ({
    id,
    name: data.name || id,
    balance: data.balance || 0,
    level: data.level || 1
  }))
  
  const perPage = 10
  const totalPages = Math.ceil(playersList.length / perPage)
  const start = page * perPage
  const end = start + perPage
  const pagePlayers = playersList.slice(start, end)
  
  let message = `👥 *СПИСОК ИГРОКОВ* (${playersList.length})\n\n`
  
  for (let i = 0; i < pagePlayers.length; i++) {
    const p = pagePlayers[i]
    message += `${start + i + 1}. *${p.name}* — 💰$${p.balance} ⭐${p.level}\n`
    message += `   🆔 \`${p.id}\`\n\n`
  }
  
  const buttons = []
  if (page > 0) {
    buttons.push({ text: '◀️ НАЗАД', callback_data: `admin_list_page_${page - 1}` })
  }
  if (page < totalPages - 1) {
    buttons.push({ text: 'ВПЕРЁД ▶️', callback_data: `admin_list_page_${page + 1}` })
  }
  buttons.push({ text: '🔙 НАЗАД', callback_data: 'admin_back' })
  
  const keyboard = { reply_markup: { inline_keyboard: [buttons] } }
  await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
}

// Выдать деньги
async function giveMoneyToPlayer(ctx, playerId, amount) {
  const player = getPlayer(playerId)
  savePlayer(playerId, { balance: player.balance + amount })
  return player.name || playerId
}

// Выдать осколки
async function giveShardsToPlayer(ctx, playerId, amount) {
  const player = getPlayer(playerId)
  savePlayer(playerId, { shards: (player.shards || 0) + amount })
  return player.name || playerId
}

// Выдать уровни
async function giveLevelToPlayer(ctx, playerId, levels) {
  const player = getPlayer(playerId)
  savePlayer(playerId, { level: player.level + levels })
  return player.name || playerId
}

// Выдать наркотики
async function giveDrugsToPlayer(ctx, playerId, drug, amount) {
  const player = getPlayer(playerId)
  const inventory = player.inventory || {}
  inventory[drug] = (inventory[drug] || 0) + amount
  savePlayer(playerId, { inventory })
  return player.name || playerId
}

// Очистить базу
async function clearDatabase() {
  const empty = {}
  saveAllPlayers(empty)
  // Перезагружаем Map
  const { players } = require('./db')
  players.clear()
}

// Статистика
async function showAdminStats(ctx) {
  const players = getAllPlayers()
  const totalPlayers = Object.keys(players).length
  let totalBalance = 0
  let totalShards = 0
  let totalLevels = 0
  
  for (const [id, data] of Object.entries(players)) {
    totalBalance += data.balance || 0
    totalShards += data.shards || 0
    totalLevels += data.level || 1
  }
  
  const message = `📊 *СТАТИСТИКА БОТА*\n\n👥 Всего игроков: ${totalPlayers}\n💰 Общий баланс: $${totalBalance}\n💎 Всего осколков: ${totalShards}\n⭐ Всего уровней: ${totalLevels}\n📊 Средний уровень: ${Math.round(totalLevels / totalPlayers || 0)}`
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [[{ text: '🔙 НАЗАД', callback_data: 'admin_back' }]]
    }
  }
  
  await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
}

// Запрос на ввод ID игрока
async function askForPlayerId(ctx, action, extra = null) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [[{ text: '🔙 НАЗАД', callback_data: 'admin_back' }]]
    }
  }
  await ctx.editMessageText(`👑 *АДМИН-ПАНЕЛЬ*\n\nВведи ID игрока для действия: *${action}*\n\nНапиши ID в чат.`, { parse_mode: 'Markdown', ...keyboard })
  
  // Сохраняем состояние
  const userId = ctx.from.id.toString()
  adminSessions.set(userId, { action, extra })
}

// Главный обработчик админ-команд
async function handleAdminCommand(ctx) {
  const text = ctx.message.text.toLowerCase()
  const userId = ctx.from.id.toString()
  
  if (!isAdmin(parseInt(userId))) {
    await ctx.reply('❌ *ДОСТУП ЗАПРЕЩЁН!*', { parse_mode: 'Markdown' })
    return
  }
  
  // Проверка пароля
  if (text.startsWith('admin') || text === 'админ') {
    const password = text.split(' ')[1]
    if (password === ADMIN_PASSWORD) {
      adminSessions.set(userId, true)
      setTimeout(() => adminSessions.delete(userId), 30 * 60 * 1000)
      await showAdminMenu(ctx)
    } else {
      await ctx.reply('❌ *НЕВЕРНЫЙ ПАРОЛЬ!*', { parse_mode: 'Markdown' })
    }
    return
  }
  
  // Если админ авторизован
  if (adminSessions.has(userId)) {
    const session = adminSessions.get(userId)
    if (session && session.action) {
      const playerId = text.trim()
      const action = session.action
      const extra = session.extra
      
      switch (action) {
        case 'give_money': {
          await ctx.reply(`💰 Введи сумму для игрока ${playerId}:`)
          adminSessions.set(userId, { action: 'give_money_amount', playerId })
          break
        }
        case 'give_money_amount': {
          const amount = parseInt(text)
          if (isNaN(amount)) {
            await ctx.reply('❌ Введи число!')
            return
          }
          const name = await giveMoneyToPlayer(ctx, session.playerId, amount)
          await ctx.reply(`✅ Выдано $${amount} игроку *${name}*!`, { parse_mode: 'Markdown' })
          adminSessions.delete(userId)
          await showAdminMenu(ctx)
          break
        }
        case 'give_shards': {
          await ctx.reply(`💎 Введи количество осколков для игрока ${playerId}:`)
          adminSessions.set(userId, { action: 'give_shards_amount', playerId })
          break
        }
        case 'give_shards_amount': {
          const amount = parseInt(text)
          if (isNaN(amount)) {
            await ctx.reply('❌ Введи число!')
            return
          }
          const name = await giveShardsToPlayer(ctx, session.playerId, amount)
          await ctx.reply(`✅ Выдано ${amount}💎 игроку *${name}*!`, { parse_mode: 'Markdown' })
          adminSessions.delete(userId)
          await showAdminMenu(ctx)
          break
        }
        default:
          adminSessions.delete(userId)
          await showAdminMenu(ctx)
      }
      return
    }
  }
}

async function adminCallbackHandler(ctx, data) {
  const userId = ctx.from.id.toString()
  
  if (!isAdmin(parseInt(userId))) {
    await ctx.answerCbQuery('Доступ запрещён!')
    return
  }
  
  if (data === 'admin_close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (data === 'admin_back') {
    await showAdminMenu(ctx)
    return
  }
  
  if (data === 'admin_list') {
    await showPlayersList(ctx, 0)
    return
  }
  
  if (data.startsWith('admin_list_page_')) {
    const page = parseInt(data.replace('admin_list_page_', ''))
    await showPlayersList(ctx, page)
    return
  }
  
  if (data === 'admin_give_money') {
    await askForPlayerId(ctx, 'give_money')
    return
  }
  
  if (data === 'admin_give_shards') {
    await askForPlayerId(ctx, 'give_shards')
    return
  }
  
  if (data === 'admin_stats') {
    await showAdminStats(ctx)
    return
  }
  
  if (data === 'admin_clear_db') {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ ДА, ОЧИСТИТЬ', callback_data: 'admin_clear_confirm' }],
          [{ text: '❌ НЕТ, НАЗАД', callback_data: 'admin_back' }]
        ]
      }
    }
    await ctx.editMessageText('⚠️ *ВНИМАНИЕ!* Это действие удалит ВСЕХ игроков и их данные. Точно очистить базу?', { parse_mode: 'Markdown', ...keyboard })
    return
  }
  
  if (data === 'admin_clear_confirm') {
    await clearDatabase()
    await ctx.editMessageText('✅ *БАЗА ДАННЫХ ОЧИЩЕНА!*', { parse_mode: 'Markdown' })
    setTimeout(() => showAdminMenu(ctx), 2000)
    return
  }
  
  await showAdminMenu(ctx)
}

module.exports = { 
  showAdminMenu, 
  handleAdminCommand, 
  adminCallbackHandler,
  isAdmin,
  ADMIN_ID
}