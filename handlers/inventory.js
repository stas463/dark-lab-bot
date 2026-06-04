// handlers/inventory.js
const { getPlayer } = require('../utils/db')

// Названия наркотиков
const DRUGS_NAMES = {
  krokodil: '🐊 Крокодил',
  marijuana: '🌿 Марихуана',
  pcp: '👻 PCP',
  amphetamine: '⚡ Амфетамин',
  meth: '❄️ Мет',
  mdma: '💊 MDMA',
  heroin: '💉 Героин',
  cocaine: '⬜ Кокаин',
  blue_meth: '💎 Голубой Мет',
  lsd: '🧪 ЛСД'
}

// Названия ингредиентов
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

// Показать инвентарь с выбором категории
async function showInventory(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💊 Наркотики', callback_data: 'inv_drugs' }, { text: '🧪 Ингредиенты', callback_data: 'inv_ingredients' }],
        [{ text: '🔧 Оборудование', callback_data: 'inv_equipment' }, { text: '📖 Глифы', callback_data: 'inv_glyphs' }],
        [{ text: '❌ Закрыть', callback_data: 'inv_close' }]
      ]
    }
  }

  await ctx.reply(
    `📦 *Инвентарь*\n\nВыбери категорию:`,
    { parse_mode: 'Markdown', ...keyboard }
  )
}

// Показать наркотики
async function showDrugs(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  
  const drugs = Object.entries(inventory).filter(([key]) => DRUGS_NAMES[key])
  
  if (drugs.length === 0) {
    await ctx.editMessageText(
      `💊 *Наркотики*\n\nУ тебя нет наркотиков.\n\nСвари их через /craft`,
      { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
    )
    return
  }
  
  let message = `💊 *Твои наркотики*\n\n`
  for (const [drug, grams] of drugs) {
    message += `${DRUGS_NAMES[drug]}: ${grams} г\n`
  }
  
  await ctx.editMessageText(
    message,
    { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
  )
}

// Показать ингредиенты
async function showIngredients(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  
  const ingredients = Object.entries(inventory).filter(([key]) => !DRUGS_NAMES[key])
  
  if (ingredients.length === 0) {
    await ctx.editMessageText(
      `🧪 *Ингредиенты*\n\nУ тебя нет ингредиентов.\n\nКупи их через /shop`,
      { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
    )
    return
  }
  
  let message = `🧪 *Твои ингредиенты*\n\n`
  for (const [ing, count] of ingredients) {
    const name = INGREDIENTS_NAMES[ing] || ing
    message += `${name}: ${count} шт\n`
  }
  
  await ctx.editMessageText(
    message,
    { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
  )
}

// Показать оборудование
async function showEquipmentInv(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const equipment = player.equipment || {}
  
  if (Object.keys(equipment).length === 0) {
    await ctx.editMessageText(
      `🔧 *Оборудование*\n\nУ тебя нет оборудования.\n\nКупи его через /equipment`,
      { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
    )
    return
  }
  
  let message = `🔧 *Твоё оборудование*\n\n`
  for (const [item, count] of Object.entries(equipment)) {
    const name = item.replace(/_/g, ' ')
    message += `${name}: ${count} шт\n`
  }
  
  await ctx.editMessageText(
    message,
    { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
  )
}

// Показать глифы
async function showGlyphs(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const glyphs = player.glyphs || []
  
  if (glyphs.length === 0) {
    await ctx.editMessageText(
      `📖 *Глифы*\n\nУ тебя нет глифов.\n\nОткрой боксы через /boxes`,
      { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
    )
    return
  }
  
  let message = `📖 *Твои глифы*\n\n`
  for (const glyph of glyphs) {
    message += `✨ ${glyph}\n`
  }
  
  await ctx.editMessageText(
    message,
    { parse_mode: 'Markdown', reply_markup: ctx.callbackQuery.message.reply_markup }
  )
}

// Закрыть инвентарь
async function closeInventory(ctx) {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
}

module.exports = { 
  showInventory, 
  showDrugs, 
  showIngredients, 
  showEquipmentInv, 
  showGlyphs, 
  closeInventory 
}