// handlers/equipment.js
const { getPlayer, savePlayer } = require('../utils/db')

const EQUIPMENT = {
  filter: { name: '🔍 Фильтр', price: 50, max: 20, group: 'base' },
  pot: { name: '🍲 Котелок', price: 100, max: 20, group: 'base' },
  glass_flask: { name: '🧪 Стеклянная колба', price: 400, max: 15, group: 'chemical' },
  electric_stove: { name: '🔥 Электроплитка', price: 200, max: 15, group: 'chemical' },
  growbox: { name: '🌱 Гроубокс', price: 600, max: 15, group: 'chemical' },
  condenser: { name: '💨 Конденсатор', price: 1500, max: 10, group: 'advanced' },
  heating_mantle: { name: '🌡️ Нагревательная мантия', price: 2000, max: 10, group: 'advanced' },
  vacuum_pump: { name: '🔄 Вакуумный насос', price: 3000, max: 5, group: 'professional' },
  chromatograph: { name: '📊 Хроматограф', price: 4000, max: 3, group: 'professional' }
}

const GROUP_NAMES = {
  base: '🔧 Базовое',
  chemical: '🧪 Химическое',
  advanced: '⚙️ Продвинутое',
  professional: '💎 Профессиональное'
}

async function showEquipment(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔧 Базовое', callback_data: 'eq_group_base' }, { text: '🧪 Химическое', callback_data: 'eq_group_chemical' }],
        [{ text: '⚙️ Продвинутое', callback_data: 'eq_group_advanced' }, { text: '💎 Профессиональное', callback_data: 'eq_group_professional' }],
        [{ text: '❌ Закрыть', callback_data: 'eq_close' }]
      ]
    }
  }
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText('🔧 *Магазин оборудования*\n\nВыбери категорию:', { parse_mode: 'Markdown', ...keyboard })
  } else {
    await ctx.reply('🔧 *Магазин оборудования*\n\nВыбери категорию:', { parse_mode: 'Markdown', ...keyboard })
  }
}

async function showEquipmentGroup(ctx, groupId) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const equipment = player.equipment || {}
  
  const groupName = GROUP_NAMES[groupId]
  let message = `🔧 *${groupName} оборудование*\n\n`
  const buttons = []
  const items = []
  
  for (const [id, eq] of Object.entries(EQUIPMENT)) {
    if (eq.group === groupId) {
      const owned = equipment[id] || 0
      const max = eq.max
      const price = eq.price
      items.push({ id, name: eq.name, owned, max, price })
    }
  }
  
  for (let i = 0; i < items.length; i += 2) {
    const row = []
    const item1 = items[i]
    row.push({ text: `${item1.name} (${item1.owned}/${item1.max}) — $${item1.price}`, callback_data: `eq_buy_${item1.id}` })
    if (items[i + 1]) {
      const item2 = items[i + 1]
      row.push({ text: `${item2.name} (${item2.owned}/${item2.max}) — $${item2.price}`, callback_data: `eq_buy_${item2.id}` })
    }
    buttons.push(row)
  }
  
  buttons.push([
    { text: '❌ Закрыть', callback_data: 'eq_close' },
    { text: '🔙 Назад', callback_data: 'eq_back' }
  ])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
}

async function handleEquipmentBuy(ctx, eqId) {
  const userId = ctx.from.id.toString()
  
  const eq = EQUIPMENT[eqId]
  if (!eq) return
  
  const player = getPlayer(userId)
  const equipment = player.equipment || {}
  const currentCount = equipment[eqId] || 0
  
  if (currentCount >= eq.max) {
    await ctx.answerCbQuery(`❌ У вас уже максимум ${eq.name}!`)
    return
  }
  
  if (player.balance < eq.price) {
    await ctx.answerCbQuery(`❌ Не хватает денег! Нужно: $${eq.price}`)
    return
  }
  
  equipment[eqId] = currentCount + 1
  
  savePlayer(userId, {
    balance: player.balance - eq.price,
    equipment
  })
  
  await ctx.answerCbQuery(`✅ Куплен ${eq.name}!`)
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔧 Базовое', callback_data: 'eq_group_base' }, { text: '🧪 Химическое', callback_data: 'eq_group_chemical' }],
        [{ text: '⚙️ Продвинутое', callback_data: 'eq_group_advanced' }, { text: '💎 Профессиональное', callback_data: 'eq_group_professional' }],
        [{ text: '❌ Закрыть', callback_data: 'eq_close' }]
      ]
    }
  }
  
  await ctx.editMessageText('🔧 *Магазин оборудования*\n\nВыбери категорию:', { parse_mode: 'Markdown', ...keyboard })
}

async function handleEquipmentBack(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔧 Базовое', callback_data: 'eq_group_base' }, { text: '🧪 Химическое', callback_data: 'eq_group_chemical' }],
        [{ text: '⚙️ Продвинутое', callback_data: 'eq_group_advanced' }, { text: '💎 Профессиональное', callback_data: 'eq_group_professional' }],
        [{ text: '❌ Закрыть', callback_data: 'eq_close' }]
      ]
    }
  }
  
  await ctx.editMessageText('🔧 *Магазин оборудования*\n\nВыбери категорию:', { parse_mode: 'Markdown', ...keyboard })
}

async function closeEquipment(ctx) {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
}

module.exports = { showEquipment, handleEquipmentBuy, handleEquipmentBack, closeEquipment, showEquipmentGroup }