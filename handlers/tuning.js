// handlers/tuning.js
const { getPlayer, savePlayer } = require('../utils/db')

const CARS = [
  { id: 'bicycle', name: '🛵 Велосипед', price: 500 },
  { id: 'scooter', name: '🏍️ Скутер', price: 800 },
  { id: 'cheapCar', name: '🚗 Дешёвая тачка', price: 1500 },
  { id: 'minibus', name: '🚐 Микроавтобус', price: 3000 },
  { id: 'truck', name: '🚚 Грузовик', price: 5000 },
  { id: 'bigTruck', name: '🚛 Фура', price: 8000 },
  { id: 'armored', name: '🚀 Бронированный', price: 15000 },
  { id: 'helicopter', name: '🚁 Вертолёт', price: 25000 },
  { id: 'plane', name: '✈️ Самолёт', price: 50000 },
  { id: 'secret', name: '🛸 Секретная', price: 100000 }
]

async function showTuning(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const upgrades = player.upgrades || {}
  
  let message = '⚡ *Тюнинг машин*\n\n'
  const buttons = []
  
  for (const car of CARS) {
    if (!player.cars.includes(car.id)) continue
    
    const level = upgrades[car.id]?.speed || 0
    if (level < 5) {
      const price = car.price * (level + 1)
      message += `${car.name}: скорость ${level}/5\n`
      buttons.push([{ text: `Улучшить ${car.name} за $${price}`, callback_data: `tuning_${car.id}` }])
    } else {
      message += `${car.name}: скорость ${level}/5 ✅ MAX\n`
    }
  }
  
  if (buttons.length === 0) {
    message += '\n✨ Все машины уже улучшены до максимума!'
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } else {
    buttons.push([{ text: '❌ Закрыть', callback_data: 'tuning_close' }])
    const keyboard = { reply_markup: { inline_keyboard: buttons } }
    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
  }
}

async function handleTuning(ctx, carId) {
  const userId = ctx.from.id.toString()
  
  if (carId === 'close') {
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌ Тюнинг закрыт.')
    return
  }
  
  const car = CARS.find(c => c.id === carId)
  if (!car) return
  
  const player = getPlayer(userId)
  const upgrades = player.upgrades || {}
  const currentLevel = upgrades[carId]?.speed || 0
  
  if (currentLevel >= 5) {
    await ctx.answerCbQuery('❌ Уже максимальный уровень!')
    return
  }
  
  const price = car.price * (currentLevel + 1)
  
  if (player.balance < price) {
    await ctx.answerCbQuery(`❌ Не хватает денег! Нужно: $${price}`)
    return
  }
  
  upgrades[carId] = { speed: currentLevel + 1 }
  
  savePlayer(userId, {
    balance: player.balance - price,
    upgrades
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`✅ *Улучшено!*\n🚗 ${car.name}\n⚡ Скорость +5%\n💰 Остаток: $${player.balance - price}`, { parse_mode: 'Markdown' })
}

module.exports = { showTuning, handleTuning }