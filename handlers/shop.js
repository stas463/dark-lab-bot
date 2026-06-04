// handlers/shop.js
const { getPlayer, savePlayer } = require('../utils/db')

const RECIPES = {
  krokodil: { name: '🐊 Крокодил', ingredients: { codeine_pills: 2, iodine: 3, red_phosphorus: 1 } },
  marijuana: { name: '🌿 Марихуана', ingredients: { cannabis_seeds: 1, soil: 1, fertilizer: 2 } },
  pcp: { name: '👻 PCP', ingredients: { piperidine: 2, cyclohexanone: 2, bromobenzene: 1 } },
  amphetamine: { name: '⚡ Амфетамин', ingredients: { p2np: 1, methylamine: 1, hydrochloric_acid: 2 } },
  meth: { name: '❄️ Мет', ingredients: { red_phosphorus: 2, iodine: 3, hydrochloric_acid: 2, acetone: 2 } },
  mdma: { name: '💊 MDMA', ingredients: { safrole: 2, methylamine: 2, hydrochloric_acid: 3, acetone: 4 } },
  heroin: { name: '💉 Героин', ingredients: { raw_opium: 5, acetic_anhydride: 2, chloroform: 2 } },
  cocaine: { name: '⬜ Кокаин', ingredients: { coca_leaves: 8, gasoline: 4, acetone: 3 } },
  blue_meth: { name: '💎 Голубой Мет', ingredients: { methylamine: 2, red_phosphorus: 2, iodine: 4, hydrochloric_acid: 3 } },
  lsd: { name: '🧪 ЛСД', ingredients: { ergotamine: 3, diethylamine: 2, chloroform: 3, acetone: 5 } }
}

const INGREDIENTS = {
  codeine_pills: { name: '💊 Кодеин', price: 200 },
  iodine: { name: '🟤 Йод', price: 40 },
  red_phosphorus: { name: '🔴 Красный фосфор', price: 500 },
  cannabis_seeds: { name: '🌱 Семена конопли', price: 75 },
  soil: { name: '🪴 Земля', price: 10 },
  fertilizer: { name: '💩 Удобрение', price: 8 },
  piperidine: { name: '🧪 Пиперидин', price: 450 },
  cyclohexanone: { name: '🧪 Циклогексанон', price: 350 },
  bromobenzene: { name: '🧪 Бромбензол', price: 400 },
  p2np: { name: '🧪 P2NP', price: 650 },
  methylamine: { name: '🧪 Метиламин', price: 600 },
  hydrochloric_acid: { name: '🧪 Соляная кислота', price: 100 },
  acetone: { name: '💧 Ацетон', price: 25 },
  safrole: { name: '🌿 Сафрол', price: 1100 },
  raw_opium: { name: '💧 Сырой опиум', price: 120 },
  acetic_anhydride: { name: '🧪 Уксусный ангидрид', price: 900 },
  chloroform: { name: '🧪 Хлороформ', price: 150 },
  coca_leaves: { name: '🌿 Листья коки', price: 15 },
  gasoline: { name: '⛽ Бензин', price: 15 },
  ergotamine: { name: '🍄 Эрготамин', price: 1200 },
  diethylamine: { name: '🧪 Диэтиламин', price: 800 }
}

const INGREDIENTS_NAMES = {
  codeine_pills: '💊 Кодеин',
  iodine: '🟤 Йод',
  red_phosphorus: '🔴 Красный фосфор',
  cannabis_seeds: '🌱 Семена конопли',
  soil: '🪴 Земля',
  fertilizer: '💩 Удобрение',
  piperidine: '🧪 Пиперидин',
  cyclohexanone: '🧪 Циклогексанон',
  bromobenzene: '🧪 Бромбензол',
  p2np: '🧪 P2NP',
  methylamine: '🧪 Метиламин',
  hydrochloric_acid: '🧪 Соляная кислота',
  acetone: '💧 Ацетон',
  safrole: '🌿 Сафрол',
  raw_opium: '💧 Сырой опиум',
  acetic_anhydride: '🧪 Уксусный ангидрид',
  chloroform: '🧪 Хлороформ',
  coca_leaves: '🌿 Листья коки',
  gasoline: '⛽ Бензин',
  ergotamine: '🍄 Эрготамин',
  diethylamine: '🧪 Диэтиламин'
}

async function showDrugList(ctx) {
  const drugs = Object.keys(RECIPES)
  const buttons = []
  
  for (let i = 0; i < drugs.length; i += 2) {
    const row = []
    row.push({ text: RECIPES[drugs[i]].name, callback_data: `drug_${drugs[i]}` })
    if (drugs[i + 1]) {
      row.push({ text: RECIPES[drugs[i + 1]].name, callback_data: `drug_${drugs[i + 1]}` })
    }
    buttons.push(row)
  }
  buttons.push([{ text: '❌ Закрыть', callback_data: 'drug_close' }])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText('🏪 *Магазин ингредиентов*\n\nВыбери наркотик:', { parse_mode: 'Markdown', ...keyboard })
  } else {
    await ctx.reply('🏪 *Магазин ингредиентов*\n\nВыбери наркотик:', { parse_mode: 'Markdown', ...keyboard })
  }
}

async function showIngredientsForDrug(ctx, drugKey) {
  const recipe = RECIPES[drugKey]
  if (!recipe) return
  
  let message = `🧪 *${recipe.name}*\n\n📦 Нужные ингредиенты:\n`
  const buttons = []
  
  for (const [ingId, amount] of Object.entries(recipe.ingredients)) {
    const ing = INGREDIENTS[ingId]
    if (ing) {
      message += `• ${INGREDIENTS_NAMES[ingId]}: ${amount} шт — $${ing.price * amount}\n`
      buttons.push([{ text: `💰 Купить ${INGREDIENTS_NAMES[ingId]} (${amount} шт) за $${ing.price * amount}`, callback_data: `buy_${ingId}_${amount}` }])
    }
  }
  
  buttons.push([{ text: '🔙 Назад', callback_data: 'drug_back' }])
  buttons.push([{ text: '❌ Закрыть', callback_data: 'drug_close' }])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
}

async function buyIngredient(ctx, ingId, amount) {
  const userId = ctx.from.id.toString()
  const ingredient = INGREDIENTS[ingId]
  if (!ingredient) return false
  
  const totalPrice = ingredient.price * amount
  const player = getPlayer(userId)
  
  if (player.balance < totalPrice) {
    await ctx.answerCbQuery(`❌ Не хватает денег! Нужно: $${totalPrice}`)
    return false
  }
  
  const inventory = player.inventory || {}
  inventory[ingId] = (inventory[ingId] || 0) + amount
  
  savePlayer(userId, {
    balance: player.balance - totalPrice,
    inventory
  })
  
  await ctx.answerCbQuery(`✅ Куплено ${amount} шт ${INGREDIENTS_NAMES[ingId]}!`)
  await ctx.editMessageText(`✅ *Куплено!*\n📦 ${INGREDIENTS_NAMES[ingId]}: ${amount} шт\n💰 Остаток: $${player.balance - totalPrice}`, { parse_mode: 'Markdown' })
  return true
}

async function handleTextBuy(ctx) {
  const text = ctx.message.text.toLowerCase()
  
  const match = text.match(/^(?:купить|buy)\s+([а-яёa-z]+)\s+(\d+)/i)
  if (!match) return false
  
  const itemName = match[1].toLowerCase()
  const amount = parseInt(match[2])
  
  if (amount <= 0 || amount > 1000) {
    await ctx.reply('❌ *Некорректное количество!* (1-1000)', { parse_mode: 'Markdown' })
    return true
  }
  
  let ingId = null
  for (const [id, name] of Object.entries(INGREDIENTS_NAMES)) {
    if (itemName === name.toLowerCase().replace(/[^а-яё]/g, '') || itemName === id.toLowerCase()) {
      ingId = id
      break
    }
  }
  
  if (!ingId) {
    await ctx.reply(`❌ *Ингредиент "${match[1]}" не найден!*`, { parse_mode: 'Markdown' })
    return true
  }
  
  const totalPrice = INGREDIENTS[ingId].price * amount
  const player = getPlayer(ctx.from.id.toString())
  
  if (player.balance < totalPrice) {
    await ctx.reply(`❌ *Не хватает денег!*\n💰 Нужно: $${totalPrice}\n💰 Есть: $${player.balance}`, { parse_mode: 'Markdown' })
    return true
  }
  
  const inventory = player.inventory || {}
  inventory[ingId] = (inventory[ingId] || 0) + amount
  
  savePlayer(ctx.from.id.toString(), {
    balance: player.balance - totalPrice,
    inventory
  })
  
  await ctx.reply(`✅ *Куплено!*\n📦 ${INGREDIENTS_NAMES[ingId]}: ${amount} шт\n💰 Остаток: $${player.balance - totalPrice}`, { parse_mode: 'Markdown' })
  return true
}

async function shopHandler(ctx, data) {
  if (data === 'drug_close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (data === 'drug_back') {
    await showDrugList(ctx)
    return
  }
  
  if (data && data.startsWith('drug_')) {
    const drugKey = data.replace('drug_', '')
    if (RECIPES[drugKey]) {
      await showIngredientsForDrug(ctx, drugKey)
    }
    return
  }
  
  if (data && data.startsWith('buy_')) {
    const parts = data.split('_')
    const ingId = parts[1]
    const amount = parseInt(parts[2])
    await buyIngredient(ctx, ingId, amount)
    return
  }
}

async function showShop(ctx) {
  await showDrugList(ctx)
}

async function showInventory(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  
  if (Object.keys(inventory).length === 0) {
    await ctx.reply('📦 *Инвентарь пуст*', { parse_mode: 'Markdown' })
    return
  }
  
  let message = '📦 *Твой инвентарь:*\n\n'
  for (const [id, count] of Object.entries(inventory)) {
    message += `• ${INGREDIENTS_NAMES[id] || id}: ${count} шт\n`
  }
  await ctx.reply(message, { parse_mode: 'Markdown' })
}

module.exports = { showShop, shopHandler, showInventory, handleTextBuy, buyIngredient }