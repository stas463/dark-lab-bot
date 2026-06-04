// api/index.js
const { Telegraf } = require('telegraf')
const config = require('../config')

// Импорт всех обработчиков
const { showProfile } = require('../handlers/profile')
const { showHelp, handleHelpButtons, handleHelpBack } = require('../handlers/help')
const { showCraftMenu, craftHandler } = require('../handlers/craft')
const { showSellMenu, handleSell } = require('../handlers/sell')
const { showShop, shopHandler, showInventory, handleTextBuy } = require('../handlers/shop')
const { showCars, handleCarBuy, handleCarActivate } = require('../handlers/cars')
const { showBoxes, handleBox } = require('../handlers/boxes')
const { showCasino, handleCasino, handleCasinoCommand, handleHit, handleStand } = require('../handlers/casino')
const { showBusiness, handleBusinessBuy } = require('../handlers/business')
const { showEquipment, handleEquipmentBuy, handleEquipmentBack, closeEquipment, showEquipmentGroup } = require('../handlers/equipment')
const { showTuning, handleTuning } = require('../handlers/tuning')
const { showReferrals, claimReferralReward } = require('../handlers/referrals')
const { showAchievements, achievementHandler } = require('../handlers/achievements')
const { showDaily, claimDaily } = require('../handlers/daily')
const { showGuild, handleGuild } = require('../handlers/guild')
const { showShardShop, handleShardBuy } = require('../handlers/shardshop')
const { showFusion, handleFusion } = require('../handlers/fusion')
const { showRepair, handleRepair } = require('../handlers/repair')
const { showLeaderboard, handleLeaderboard } = require('../handlers/leaderboard')
const { showDailyQuests, claimQuest } = require('../handlers/dailyQuests')
const { showWanted, bribe, raid } = require('../handlers/police')
const { showDrugs, showIngredients, showEquipmentInv, showGlyphs, closeInventory } = require('../handlers/inventory')
const { showAdminMenu, handleAdminCommand, adminCallbackHandler } = require('../handlers/admin')

const bot = new Telegraf(config.BOT_TOKEN)

// Логирование ошибок
bot.catch((err, ctx) => {
  console.error('❌ Ошибка бота:', err)
})

// ========== ПРИВЕТСТВИЕ ==========
bot.start(async (ctx) => {
  console.log('✅ /start от', ctx.from.id)
  const { getPlayer } = require('../utils/db')
  await getPlayer(ctx.from.id.toString(), ctx.from.first_name)
  await ctx.reply(`🔬 *ТЁМНАЯ ЛАБОРАТОРИЯ*\n\nДобро пожаловать, ${ctx.from.first_name}!`)
})

// Остальные команды (оставь как есть, только добавь логи)
bot.command('id', async (ctx) => {
  await ctx.reply(`🆔 *ТВОЙ ID:* \`${ctx.from.id}\``, { parse_mode: 'Markdown' })
})

// ... (все остальные твои команды, просто добавь в начало каждой console.log)

// ========== КНОПКИ БЛЭКДЖЕКА ==========
bot.action('bj_hit', async (ctx) => {
  console.log('🎴 Кнопка ЕЩЕ от', ctx.from.id)
  await handleHit(ctx)
})

bot.action('bj_stand', async (ctx) => {
  console.log('🛑 Кнопка СТОП от', ctx.from.id)
  await handleStand(ctx)
})

// ========== ТЕКСТОВЫЕ КОМАНДЫ ==========
bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase()
  console.log(`📩 Текст от ${ctx.from.id}: ${text}`)
  
  if (text.startsWith('очко') || text.startsWith('бдж') || text.startsWith('блэкджек')) {
    await handleCasinoCommand(ctx)
    return
  }
  
  if (text.startsWith('рул')) {
    await handleCasinoCommand(ctx)
    return
  }
  
  if (text.startsWith('admin') || text === 'админ') {
    await handleAdminCommand(ctx)
    return
  }
  
  await handleTextBuy(ctx)
})

// ========== WEBHOOK HANDLER ==========
export default async function handler(req, res) {
  console.log(`📨 Получен ${req.method} запрос, URL: ${req.url}`)
  
  if (req.method === 'POST') {
    try {
      console.log('📦 Тело запроса:', JSON.stringify(req.body).slice(0, 200))
      await bot.handleUpdate(req.body)
      console.log('✅ Обновление обработано')
      res.status(200).send('OK')
    } catch (err) {
      console.error('❌ Ошибка при обработке:', err)
      res.status(500).send(`Error: ${err.message}`)
    }
  } else {
    res.status(200).send('Dark Lab Bot is running!')
  }
}
