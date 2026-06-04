// handlers/cars.js
const { getPlayer, savePlayer } = require('../utils/db')

const CARS = [
  { id: 'walk', name: '🚶‍♂️ Пешком', drugPrice: 0, drugName: '', drugGrams: 0 },
  { id: 'bicycle', name: '🛵 Велосипед', drugPrice: 10, drugName: '🌿 Марихуана', drugGrams: 10, requiredDrug: 'marijuana' },
  { id: 'scooter', name: '🏍️ Скутер', drugPrice: 15, drugName: '🌿 Марихуана', drugGrams: 15, requiredDrug: 'marijuana' },
  { id: 'cheapCar', name: '🚗 Дешёвая тачка', drugPrice: 30, drugName: '❄️ Мет', drugGrams: 30, requiredDrug: 'meth' },
  { id: 'minibus', name: '🚐 Микроавтобус', drugPrice: 60, drugName: '❄️ Мет', drugGrams: 60, requiredDrug: 'meth' },
  { id: 'truck', name: '🚚 Грузовик', drugPrice: 100, drugName: '⬜ Кокаин', drugGrams: 100, requiredDrug: 'cocaine' },
  { id: 'bigTruck', name: '🚛 Фура', drugPrice: 160, drugName: '⬜ Кокаин', drugGrams: 160, requiredDrug: 'cocaine' },
  { id: 'armored', name: '🚀 Бронированный', drugPrice: 300, drugName: '💉 Героин', drugGrams: 300, requiredDrug: 'heroin' },
  { id: 'helicopter', name: '🚁 Вертолёт', drugPrice: 500, drugName: '💎 Голубой Мет', drugGrams: 500, requiredDrug: 'blue_meth' },
  { id: 'plane', name: '✈️ Самолёт', drugPrice: 1000, drugName: '🧪 ЛСД', drugGrams: 1000, requiredDrug: 'lsd' },
  { id: 'secret', name: '🛸 Секретная', drugPrice: 2000, drugName: '🧪 ЛСД', drugGrams: 2000, requiredDrug: 'lsd' }
]

const DRUG_NAMES = {
  marijuana: '🌿 Марихуана',
  meth: '❄️ Мет',
  cocaine: '⬜ Кокаин',
  heroin: '💉 Героин',
  blue_meth: '💎 Голубой Мет',
  lsd: '🧪 ЛСД',
  krokodil: '🐊 Крокодил',
  pcp: '👻 PCP',
  amphetamine: '⚡ Амфетамин',
  mdma: '💊 MDMA'
}

async function showCars(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  
  let message = `🚗 *ТВОИ МАШИНЫ*\n`
  message += `✅ АКТИВНАЯ: ${player.activeCar}\n\n`
  
  // Список машин
  for (const car of CARS) {
    if (car.id === 'walk') continue
    
    const owned = player.cars.includes(car.id)
    const active = player.activeCar === car.id
    const icon = active ? '✅' : (owned ? '📌' : '🔒')
    let priceText = ''
    if (owned) {
      priceText = active ? 'Активна' : 'В гараже'
    } else {
      priceText = `${car.drugGrams}г ${car.drugName}`
    }
    message += `${icon} ${car.name} — ${priceText}\n`
  }
  
  // Показываем сколько наркотиков есть у игрока
  message += `\n📦 *ТВОИ НАРКОТИКИ:*\n`
  let hasDrugs = false
  for (const [drug, name] of Object.entries(DRUG_NAMES)) {
    const amount = inventory[drug] || 0
    if (amount > 0) {
      message += `• ${name}: ${amount}г\n`
      hasDrugs = true
    }
  }
  if (!hasDrugs) {
    message += `• НЕТ НАРКОТИКОВ\n`
  }
  
  // Кнопки покупки
  const buyButtons = []
  for (const car of CARS) {
    if (!player.cars.includes(car.id) && car.id !== 'walk') {
      buyButtons.push([{ text: `💊 Купить ${car.name} за ${car.drugGrams}г ${car.drugName}`, callback_data: `car_buy_${car.id}` }])
    }
  }
  
  // Кнопки активации
  const activateButtons = []
  for (const car of CARS) {
    if (player.cars.includes(car.id) && player.activeCar !== car.id && car.id !== 'walk') {
      activateButtons.push([{ text: `✅ Активировать ${car.name}`, callback_data: `car_activate_${car.id}` }])
    }
  }
  
  const allButtons = [...buyButtons, ...activateButtons]
  
  if (allButtons.length > 0) {
    allButtons.push([{ text: '❌ Закрыть', callback_data: 'car_close' }])
    const keyboard = { reply_markup: { inline_keyboard: allButtons } }
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard })
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
    }
  } else {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { parse_mode: 'Markdown' })
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown' })
    }
  }
}

async function handleCarBuy(ctx, carId) {
  console.log('handleCarBuy вызван, carId:', carId)
  
  const userId = ctx.from.id.toString()
  
  if (carId === 'close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  const car = CARS.find(c => c.id === carId)
  if (!car) {
    await ctx.answerCbQuery(`❌ ОШИБКА: МАШИНА НЕ НАЙДЕНА!`)
    return
  }
  
  const player = getPlayer(userId)
  const inventory = player.inventory || {}
  
  const requiredDrug = car.requiredDrug
  const requiredGrams = car.drugGrams
  const drugName = car.drugName
  
  const availableGrams = inventory[requiredDrug] || 0
  
  console.log(`Проверка: нужно ${requiredGrams}г ${requiredDrug}, есть ${availableGrams}г`)
  
  if (availableGrams < requiredGrams) {
    await ctx.answerCbQuery(`❌ НЕ ХВАТАЕТ ${drugName}!\n💊 НУЖНО: ${requiredGrams}г\n💊 ЕСТЬ: ${availableGrams}г`)
    return
  }
  
  const newInventory = { ...inventory }
  newInventory[requiredDrug] = availableGrams - requiredGrams
  if (newInventory[requiredDrug] <= 0) delete newInventory[requiredDrug]
  
  const stats = player.achievementStats || {}
  stats.cars_count = (stats.cars_count || 0) + 1
  if (car.id === 'secret') {
    stats.car_secret = (stats.car_secret || 0) + 1
  }
  
  savePlayer(userId, {
    inventory: newInventory,
    cars: [...player.cars, carId],
    achievementStats: stats
  })
  
  await ctx.answerCbQuery(`✅ МАШИНА КУПЛЕНА ЗА ${requiredGrams}г ${drugName}!`)
  await ctx.editMessageText(`✅ *МАШИНА КУПЛЕНА!*\n🚗 ${car.name}\n💊 ПОТРАЧЕНО: ${requiredGrams}г ${drugName}\n\n💊 ОСТАЛОСЬ ${drugName}: ${newInventory[requiredDrug] || 0}г\n🚗 ТЕПЕРЬ ТЫ МОЖЕШЬ АКТИВИРОВАТЬ ЭТУ МАШИНУ!`, { parse_mode: 'Markdown' })
}

async function handleCarActivate(ctx, carId) {
  console.log('handleCarActivate вызван, carId:', carId)
  
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if (!player.cars.includes(carId)) {
    await ctx.answerCbQuery(`❌ У ТЕБЯ НЕТ ЭТОЙ МАШИНЫ!`)
    return
  }
  
  savePlayer(userId, { activeCar: carId })
  
  const car = CARS.find(c => c.id === carId)
  await ctx.answerCbQuery(`✅ МАШИНА АКТИВИРОВАНА!`)
  await ctx.editMessageText(`✅ *МАШИНА АКТИВИРОВАНА!*\n🚗 ${car.name}\n\nТЕПЕРЬ ТЫ ЕЗДИШЬ НА ${car.name}!`, { parse_mode: 'Markdown' })
}

module.exports = { showCars, handleCarBuy, handleCarActivate, CARS }