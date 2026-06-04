// handlers/craft.js
const { getPlayer, savePlayer, addExp } = require('../utils/db')
const { checkAchievements } = require('./achievements')

// ВСЕ РЕЦЕПТЫ НАРКОТИКОВ (10 штук)
const RECIPES = {
  krokodil: {
    id: 'krokodil',
    name: '🐊 Крокодил',
    time: 120,
    output: 6,
    exp: 30,
    level: 1,
    price: 250,
    desc: 'Дешёвый и опасный наркотик.',
    equipment: ['filter'],
    ingredients: { codeine_pills: 2, iodine: 3, red_phosphorus: 1 }
  },
  marijuana: {
    id: 'marijuana',
    name: '🌿 Марихуана',
    time: 90,
    output: 5,
    exp: 25,
    level: 2,
    price: 70,
    desc: 'Лёгкий наркотик, популярен среди молодёжи.',
    equipment: ['pot', 'growbox'],
    ingredients: { cannabis_seeds: 1, soil: 1, fertilizer: 2 }
  },
  pcp: {
    id: 'pcp',
    name: '👻 PCP',
    time: 120,
    output: 7,
    exp: 35,
    level: 3,
    price: 120,
    desc: 'Фенциклидин. Мощный диссоциатив.',
    equipment: ['glass_flask', 'mixing_barrel'],
    ingredients: { piperidine: 2, cyclohexanone: 2, bromobenzene: 1 }
  },
  amphetamine: {
    id: 'amphetamine',
    name: '⚡ Амфетамин',
    time: 150,
    output: 5,
    exp: 40,
    level: 4,
    price: 180,
    desc: 'Стимулятор. Повышает энергию.',
    equipment: ['glass_flask', 'electric_stove'],
    ingredients: { p2np: 1, methylamine: 1, hydrochloric_acid: 2 }
  },
  meth: {
    id: 'meth',
    name: '❄️ Мет',
    time: 180,
    output: 4,
    exp: 45,
    level: 5,
    price: 300,
    desc: 'Мощный стимулятор.',
    equipment: ['electric_stove', 'glass_flask'],
    ingredients: { red_phosphorus: 2, iodine: 3, hydrochloric_acid: 2, acetone: 2 }
  },
  mdma: {
    id: 'mdma',
    name: '💊 MDMA',
    time: 210,
    output: 5,
    exp: 50,
    level: 6,
    price: 350,
    desc: 'Экстази. Популярен на вечеринках.',
    equipment: ['glass_flask', 'heating_mantle'],
    ingredients: { safrole: 2, methylamine: 2, hydrochloric_acid: 3, acetone: 4 }
  },
  heroin: {
    id: 'heroin',
    name: '💉 Героин',
    time: 240,
    output: 3,
    exp: 60,
    level: 7,
    price: 500,
    desc: 'Тяжёлый опиат.',
    equipment: ['heating_mantle', 'condenser'],
    ingredients: { raw_opium: 5, acetic_anhydride: 2, chloroform: 2 }
  },
  cocaine: {
    id: 'cocaine',
    name: '⬜ Кокаин',
    time: 300,
    output: 2,
    exp: 70,
    level: 8,
    price: 700,
    desc: 'Стимулятор для элиты.',
    equipment: ['condenser', 'vacuum_pump'],
    ingredients: { coca_leaves: 8, gasoline: 4, acetone: 3 }
  },
  blue_meth: {
    id: 'blue_meth',
    name: '💎 Голубой Мет',
    time: 360,
    output: 3,
    exp: 80,
    level: 9,
    price: 1000,
    desc: 'Мет высокой чистоты.',
    equipment: ['vacuum_pump', 'chromatograph'],
    ingredients: { methylamine: 2, red_phosphorus: 2, iodine: 4, hydrochloric_acid: 3 }
  },
  lsd: {
    id: 'lsd',
    name: '🧪 ЛСД',
    time: 480,
    output: 3,
    exp: 100,
    level: 10,
    price: 1500,
    desc: 'Психоделик.',
    equipment: ['chromatograph', 'condenser', 'vacuum_pump'],
    ingredients: { ergotamine: 3, diethylamine: 2, chloroform: 3, acetone: 5 }
  }
}

// НАЗВАНИЯ ОБОРУДОВАНИЯ
const EQUIPMENT_NAMES = {
  filter: '🔍 Фильтр',
  pot: '🍲 Котелок',
  growbox: '🌱 Гроубокс',
  glass_flask: '🧪 Стеклянная колба',
  mixing_barrel: '🛢️ Смесительная бочка',
  electric_stove: '🔥 Электроплитка',
  heating_mantle: '🌡️ Нагревательная мантия',
  condenser: '💨 Конденсатор',
  vacuum_pump: '🔄 Вакуумный насос',
  chromatograph: '📊 Хроматограф'
}

// НАЗВАНИЯ ИНГРЕДИЕНТОВ
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

const activeCrafts = new Map()

// Показать список наркотиков
async function showDrugList(ctx) {
  const drugs = Object.values(RECIPES)
  const buttons = []
  
  for (let i = 0; i < drugs.length; i += 2) {
    const row = []
    row.push({ text: `${drugs[i].name} (ур. ${drugs[i].level})`, callback_data: `craft_info_${drugs[i].id}` })
    if (drugs[i + 1]) {
      row.push({ text: `${drugs[i + 1].name} (ур. ${drugs[i + 1].level})`, callback_data: `craft_info_${drugs[i + 1].id}` })
    }
    buttons.push(row)
  }
  
  buttons.push([{ text: '❌ Отмена', callback_data: 'craft_cancel' }])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.reply('🔬 *Выбери наркотик для варки:*', { parse_mode: 'Markdown', ...keyboard })
}

// Показать информацию о наркотике
async function showDrugInfo(ctx, drugId) {
  const recipe = RECIPES[drugId]
  if (!recipe) return
  
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  const playerEquipment = player.equipment || {}
  
  let hasAllEquipment = true
  const missingEquipment = []
  const equipmentList = []
  for (const eq of recipe.equipment) {
    const has = (playerEquipment[eq] || 0) > 0
    if (!has) {
      hasAllEquipment = false
      missingEquipment.push(EQUIPMENT_NAMES[eq] || eq)
    }
    equipmentList.push(`${has ? '✅' : '❌'} ${EQUIPMENT_NAMES[eq] || eq}`)
  }
  
  let hasAllIngredients = true
  const missingIngredients = []
  const ingredientsList = []
  for (const [ing, need] of Object.entries(recipe.ingredients)) {
    const has = (inventory[ing] || 0) >= need
    if (!has) {
      hasAllIngredients = false
      missingIngredients.push(`${INGREDIENTS_NAMES[ing] || ing} (нужно ${need}, есть ${inventory[ing] || 0})`)
    }
    ingredientsList.push(`${has ? '✅' : '❌'} ${INGREDIENTS_NAMES[ing] || ing}: ${need} шт (есть: ${inventory[ing] || 0})`)
  }
  
  let message = `<b>${recipe.name}</b>\n`
  message += `${recipe.desc}\n`
  message += `⭐️ <b>Уровень:</b> ${recipe.level}\n`
  message += `⏱️ <b>Время:</b> ${recipe.time / 60} мин\n`
  message += `📦 <b>Выход:</b> ${recipe.output} г\n`
  message += `💰 <b>Цена:</b> $${recipe.price}/г\n`
  message += `✨ <b>Опыт:</b> +${recipe.exp} EXP\n\n`
  
  let hiddenBlock = `<b>🔧 Оборудование:</b>\n${equipmentList.join('\n')}\n\n`
  hiddenBlock += `<b>📦 Ингредиенты:</b>\n${ingredientsList.join('\n')}`
  
  if (!hasAllEquipment || !hasAllIngredients) {
    hiddenBlock += `\n\n<b>⚠️ Не хватает:</b>\n`
    if (!hasAllEquipment) {
      hiddenBlock += `${missingEquipment.join(', ')}\n`
    }
    if (!hasAllIngredients) {
      hiddenBlock += missingIngredients.join('\n')
    }
  }
  
  message += `<blockquote expandable>${hiddenBlock}</blockquote>`
  
  const buttons = []
  
  if (player.level >= recipe.level && hasAllEquipment && hasAllIngredients && !activeCrafts.has(userId)) {
    buttons.push([{ text: '🔬 Начать варку', callback_data: `craft_start_${drugId}` }])
  } else if (activeCrafts.has(userId)) {
    buttons.push([{ text: '⏳ Уже идёт варка', callback_data: 'craft_nothing' }])
  } else if (player.level < recipe.level) {
    buttons.push([{ text: `🔒 Требуется ${recipe.level} уровень`, callback_data: 'craft_nothing' }])
  } else {
    buttons.push([{ text: '❌ Не хватает ресурсов', callback_data: 'craft_nothing' }])
  }
  
  buttons.push([{ text: '🔙 Назад', callback_data: 'craft_back' }])
  buttons.push([{ text: '❌ Отмена', callback_data: 'craft_cancel' }])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard })
}

// Начать варку
async function startCraft(ctx, drugId) {
  const userId = ctx.from.id.toString()
  const recipe = RECIPES[drugId]
  if (!recipe) return
  
  if (activeCrafts.has(userId)) {
    await ctx.answerCbQuery('❌ Уже идёт варка!')
    return
  }
  
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  const playerEquipment = player.equipment || {}
  
  if (player.level < recipe.level) {
    await ctx.answerCbQuery(`❌ Требуется ${recipe.level} уровень!`)
    return
  }
  
  for (const eq of recipe.equipment) {
    if ((playerEquipment[eq] || 0) === 0) {
      await ctx.answerCbQuery(`❌ Нет оборудования: ${EQUIPMENT_NAMES[eq] || eq}`)
      return
    }
  }
  
  for (const [ing, need] of Object.entries(recipe.ingredients)) {
    if ((inventory[ing] || 0) < need) {
      await ctx.answerCbQuery('❌ Не хватает ингредиентов!')
      return
    }
  }
  
  const newInventory = { ...inventory }
  for (const [ing, need] of Object.entries(recipe.ingredients)) {
    newInventory[ing] = (newInventory[ing] || 0) - need
    if (newInventory[ing] <= 0) delete newInventory[ing]
  }
  
  savePlayer(userId, { inventory: newInventory })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`⚙️ *Варка началась!*\n🧪 ${recipe.name}\n⏱️ ${recipe.time / 60} мин\n📦 Выход: ${recipe.output} г\n✨ Опыт: +${recipe.exp} EXP\n\nБот сообщит о готовности.`, { parse_mode: 'Markdown' })
  
  activeCrafts.set(userId, { drugId, finishTime: Date.now() + recipe.time * 1000 })
  
  setTimeout(async () => {
    if (activeCrafts.has(userId)) {
      activeCrafts.delete(userId)
      
      const playerNow = getPlayer(userId)
      const inventoryNow = playerNow.inventory || {}
      inventoryNow[drugId] = (inventoryNow[drugId] || 0) + recipe.output
      
      const leveledUp = addExp(userId, recipe.exp)
      
      // Проверка ачивок за крафт
      let achievementsMessage = ''
      const newAchievements = await checkAchievements(userId, 'craft_count', 1)
      if (newAchievements.length > 0) {
        achievementsMessage = `\n\n🏆 *Новые достижения!*\n${newAchievements.map(a => `• ${a.name} (+${a.reward} EXP)`).join('\n')}`
      }
      
      // Проверка ачивок за конкретный наркотик
      await checkAchievements(userId, `drug_${drugId}`, recipe.output)
      
      let shardMessage = ''
      if (Math.random() < 0.05) {
        const shardsAmount = Math.floor(Math.random() * 5) + 1
        savePlayer(userId, { inventory: inventoryNow, shards: (playerNow.shards || 0) + shardsAmount })
        shardMessage = `\n✨ Выпало ${shardsAmount} осколков!`
      } else {
        savePlayer(userId, { inventory: inventoryNow })
      }
      
      let message = `✅ *Варка завершена!*\n📦 +${recipe.output} г ${recipe.name}\n✨ +${recipe.exp} EXP${shardMessage}${achievementsMessage}`
      if (leveledUp) {
        message += `\n🎉 *ПОВЫШЕНИЕ УРОВНЯ!*`
      }
      
      await ctx.reply(message, { parse_mode: 'Markdown' }).catch(() => {})
    }
  }, recipe.time * 1000)
}

// Главный обработчик
async function craftHandler(ctx) {
  const data = ctx.callbackQuery.data
  
  if (data === 'craft_cancel') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (data === 'craft_back') {
    await showDrugList(ctx)
    return
  }
  
  if (data === 'craft_nothing') {
    await ctx.answerCbQuery()
    return
  }
  
  if (data.startsWith('craft_info_')) {
    const drugId = data.replace('craft_info_', '')
    await showDrugInfo(ctx, drugId)
    return
  }
  
  if (data.startsWith('craft_start_')) {
    const drugId = data.replace('craft_start_', '')
    await startCraft(ctx, drugId)
    return
  }
  
  await ctx.answerCbQuery('Неизвестная команда')
}

async function showCraftMenu(ctx) {
  await showDrugList(ctx)
}

module.exports = { showCraftMenu, craftHandler }