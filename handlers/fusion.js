// handlers/fusion.js
const { getPlayer, savePlayer } = require('../utils/db')

const EQUIPMENT_LIST = {
  filter: { name: '🔍 Фильтр', rarity: 'common' },
  glass_flask: { name: '🧪 Стеклянная колба', rarity: 'common' },
  electric_stove: { name: '🔥 Электроплитка', rarity: 'common' },
  vacuum_pump: { name: '🔄 Вакуумный насос', rarity: 'rare' },
  chromatograph: { name: '📊 Хроматограф', rarity: 'epic' }
}

const UPGRADE_CHANCE = {
  common: 0.30,
  rare: 0.20,
  epic: 0.10,
  legendary: 0.05,
  mythic: 0
}

const NEXT_RARITY = {
  common: 'rare',
  rare: 'epic',
  epic: 'legendary',
  legendary: 'mythic',
  mythic: null
}

const RARITY_NAMES = {
  common: '⚪ Обычный',
  rare: '🔵 Редкий',
  epic: '🟣 Эпический',
  legendary: '🟠 Легендарный',
  mythic: '🔴 Мифический'
}

let selectedFusion = new Map()

async function showFusion(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const equipment = player.equipment || {}
  
  const buttons = []
  for (const [id, count] of Object.entries(equipment)) {
    const eq = EQUIPMENT_LIST[id]
    if (eq && count > 0) {
      buttons.push([{ text: `${eq.name} (${count} шт) — ${RARITY_NAMES[eq.rarity]}`, callback_data: `fusion_select_${id}` }])
    }
  }
  
  if (buttons.length === 0) {
    await ctx.reply('❌ *У тебя нет оборудования для скрещивания!\nКупи его в /equipment*', { parse_mode: 'Markdown' })
    return
  }
  
  buttons.push([{ text: '❌ Отмена', callback_data: 'fusion_cancel' }])
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.reply('🔮 *Выбери ПЕРВЫЙ предмет для скрещивания:*', { parse_mode: 'Markdown', ...keyboard })
}

async function handleFusion(ctx, action, itemId) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if (action === 'cancel') {
    selectedFusion.delete(userId)
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (action === 'select') {
    const eq = EQUIPMENT_LIST[itemId]
    if (!eq) return
    
    const equipment = player.equipment || {}
    if ((equipment[itemId] || 0) < 1) {
      await ctx.answerCbQuery('❌ У тебя нет этого предмета!')
      return
    }
    
    selectedFusion.set(userId, { firstId: itemId, firstRarity: eq.rarity })
    
    const buttons = []
    for (const [id, count] of Object.entries(equipment)) {
      const eq2 = EQUIPMENT_LIST[id]
      if (eq2 && count > 0) {
        buttons.push([{ text: `${eq2.name} (${count} шт) — ${RARITY_NAMES[eq2.rarity]}`, callback_data: `fusion_second_${id}` }])
      }
    }
    buttons.push([{ text: '❌ Отмена', callback_data: 'fusion_cancel' }])
    const keyboard = { reply_markup: { inline_keyboard: buttons } }
    await ctx.editMessageText(`✅ Выбран первый предмет: ${eq.name}\n\n🔮 *Выбери ВТОРОЙ предмет:*`, { parse_mode: 'Markdown', ...keyboard })
    return
  }
  
  if (action === 'second') {
    const first = selectedFusion.get(userId)
    if (!first) {
      await ctx.answerCbQuery('❌ Сначала выбери первый предмет!')
      return
    }
    
    const eq1 = EQUIPMENT_LIST[first.firstId]
    const eq2 = EQUIPMENT_LIST[itemId]
    
    if (!eq1 || !eq2) return
    
    if (eq1.rarity !== eq2.rarity) {
      await ctx.answerCbQuery('❌ Можно скрещивать только предметы ОДИНАКОВОЙ редкости!')
      return
    }
    
    const nextRarity = NEXT_RARITY[eq1.rarity]
    if (!nextRarity) {
      await ctx.answerCbQuery('❌ Этот предмет уже максимальной редкости!')
      return
    }
    
    const chance = UPGRADE_CHANCE[eq1.rarity]
    const success = Math.random() < chance
    const useProtection = (player.protectionAmulets || 0) > 0
    
    let message = `🔮 *Скрещивание*\n`
    message += `📦 Предмет 1: ${eq1.name} (${RARITY_NAMES[eq1.rarity]})\n`
    message += `📦 Предмет 2: ${eq2.name} (${RARITY_NAMES[eq2.rarity]})\n`
    message += `📊 Шанс успеха: ${chance * 100}%\n\n`
    
    const equipment = player.equipment || {}
    const newEquipment = { ...equipment }
    
    if (success) {
      newEquipment[first.firstId] = (newEquipment[first.firstId] || 1) - 1
      if (newEquipment[first.firstId] <= 0) delete newEquipment[first.firstId]
      newEquipment[itemId] = (newEquipment[itemId] || 1) - 1
      if (newEquipment[itemId] <= 0) delete newEquipment[itemId]
      
      const newRarity = nextRarity
      const newItemId = `${first.firstId}_upgraded`
      newEquipment[newItemId] = (newEquipment[newItemId] || 0) + 1
      
      savePlayer(userId, { equipment: newEquipment })
      message += `🎉 *УСПЕХ!* Ты получил ${eq1.name} (${RARITY_NAMES[newRarity]})!`
    } else {
      if (useProtection) {
        savePlayer(userId, { protectionAmulets: (player.protectionAmulets || 0) - 1 })
        message += `🛡️ *Амулет защиты сработал!* Предметы сохранены.\nОсталось амулетов: ${(player.protectionAmulets || 0) - 1}`
      } else {
        newEquipment[first.firstId] = (newEquipment[first.firstId] || 1) - 1
        if (newEquipment[first.firstId] <= 0) delete newEquipment[first.firstId]
        newEquipment[itemId] = (newEquipment[itemId] || 1) - 1
        if (newEquipment[itemId] <= 0) delete newEquipment[itemId]
        savePlayer(userId, { equipment: newEquipment })
        message += `💥 *НЕУДАЧА!* Оба предмета сгорели при скрещивании.`
      }
    }
    
    selectedFusion.delete(userId)
    await ctx.answerCbQuery()
    await ctx.editMessageText(message, { parse_mode: 'Markdown' })
  }
}

module.exports = { showFusion, handleFusion }