// handlers/repair.js
const { getPlayer, savePlayer } = require('../utils/db')

const CARS = [
  { id: 'bicycle', name: '🛵 Велосипед', basePrice: 500 },
  { id: 'scooter', name: '🏍️ Скутер', basePrice: 800 },
  { id: 'cheapCar', name: '🚗 Дешёвая тачка', basePrice: 1500 },
  { id: 'minibus', name: '🚐 Микроавтобус', basePrice: 3000 },
  { id: 'truck', name: '🚚 Грузовик', basePrice: 5000 },
  { id: 'bigTruck', name: '🚛 Фура', basePrice: 8000 },
  { id: 'armored', name: '🚀 Бронированный', basePrice: 15000 },
  { id: 'helicopter', name: '🚁 Вертолёт', basePrice: 25000 },
  { id: 'plane', name: '✈️ Самолёт', basePrice: 50000 },
  { id: 'secret', name: '🛸 Секретная', basePrice: 100000 }
]

async function showRepair(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const cars = player.cars || []
  const carsState = player.carsState || {}
  
  const needRepair = []
  for (const carId of cars) {
    const wear = carsState[carId]?.wear || 0
    if (wear > 0) {
      const car = CARS.find(c => c.id === carId)
      if (car) {
        const price = Math.ceil((wear / 100) * car.basePrice / 5)
        needRepair.push({ carId, name: car.name, wear, price })
      }
    }
  }
  
  if (needRepair.length === 0) {
    await ctx.reply('🔧 *Все машины в идеальном состоянии!*', { parse_mode: 'Markdown' })
    return
  }
  
  let message = '🔧 *Ремонт машин*\n\n'
  const buttons = []
  for (const car of needRepair) {
    message += `• ${car.name}: износ ${car.wear}% — ремонт: $${car.price}\n`
    buttons.push([{ text: `🔧 Починить ${car.name} за $${car.price}`, callback_data: `repair_${car.carId}` }])
  }
  buttons.push([{ text: '❌ Закрыть', callback_data: 'repair_close' }])
  
  const keyboard = { reply_markup: { inline_keyboard: buttons } }
  await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
}

async function handleRepair(ctx, carId) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const carsState = player.carsState || {}
  const wear = carsState[carId]?.wear || 0
  
  if (wear <= 0) {
    await ctx.answerCbQuery('✅ Эта машина уже в идеальном состоянии!')
    return
  }
  
  const car = CARS.find(c => c.id === carId)
  if (!car) return
  
  const price = Math.ceil((wear / 100) * car.basePrice / 5)
  
  if (player.balance < price) {
    await ctx.answerCbQuery(`❌ Не хватает денег! Нужно: $${price}`)
    return
  }
  
  const newCarsState = { ...carsState }
  newCarsState[carId] = { ...newCarsState[carId], wear: 0 }
  
  savePlayer(userId, {
    balance: player.balance - price,
    carsState: newCarsState
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`✅ *Машина отремонтирована!*\n🚗 ${car.name}\n💰 Остаток: $${player.balance - price}`, { parse_mode: 'Markdown' })
}

module.exports = { showRepair, handleRepair }