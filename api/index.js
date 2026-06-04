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
const { showCasino, handleCasino, handleCasinoCommand } = require('../handlers/casino')
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

// ========== ПРИВЕТСТВИЕ ==========
bot.start(async (ctx) => {
  const { getPlayer } = require('../utils/db')
  await getPlayer(ctx.from.id.toString(), ctx.from.first_name)
  
  await ctx.reply(`
🔬 *ТЁМНАЯ ЛАБОРАТОРИЯ*

Добро пожаловать, ${ctx.from.first_name}!

🎮 *ОСНОВНЫЕ КОМАНДЫ:*
/start — запустить
/profile — профиль
/craft — сварить
/sell — продать
/shop — магазин
/inventory — инвентарь
/help — помощь

🎰 *КАЗИНО:*
очко 100 — блэкджек
рул кра 100 — рулетка

🚗 *МАШИНЫ ПОКУПАЮТСЯ ЗА НАРКОТИКИ!*

🏆 *85 ДОСТИЖЕНИЙ ЖДУТ ТЕБЯ!*
/top — таблица лидеров

🖥️ *Mini App:* кнопка меню внизу!
  `, { parse_mode: 'Markdown' })
})

bot.command('id', async (ctx) => {
  await ctx.reply(`🆔 *ТВОЙ ID:* \`${ctx.from.id}\``, { parse_mode: 'Markdown' })
})

// ========== ПОМОЩЬ ==========
bot.hears(/помощь/i, showHelp)
bot.command('help', showHelp)
bot.action('help_main', async (ctx) => handleHelpButtons(ctx, 'help_main'))
bot.action('help_economy', async (ctx) => handleHelpButtons(ctx, 'help_economy'))
bot.action('help_cars', async (ctx) => handleHelpButtons(ctx, 'help_cars'))
bot.action('help_equipment', async (ctx) => handleHelpButtons(ctx, 'help_equipment'))
bot.action('help_social', async (ctx) => handleHelpButtons(ctx, 'help_social'))
bot.action('help_progress', async (ctx) => handleHelpButtons(ctx, 'help_progress'))
bot.action('help_back', async (ctx) => handleHelpBack(ctx))
bot.action('help_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== ПРОФИЛЬ ==========
bot.hears(/профиль/i, showProfile)
bot.command('profile', showProfile)

// ========== МАГАЗИН ==========
bot.hears(/магазин/i, showShop)
bot.command('shop', showShop)
bot.action(/drug_/, async (ctx) => shopHandler(ctx, ctx.callbackQuery.data))
bot.action(/buy_/, async (ctx) => shopHandler(ctx, ctx.callbackQuery.data))
bot.action('drug_back', async (ctx) => shopHandler(ctx, 'drug_back'))
bot.action('drug_close', async (ctx) => shopHandler(ctx, 'drug_close'))

// ========== ИНВЕНТАРЬ ==========
bot.hears(/инвентарь/i, showInventory)
bot.command('inventory', showInventory)
bot.action(/inv_/, async (ctx) => {
  const data = ctx.callbackQuery.data
  if (data === 'inv_drugs') await showDrugs(ctx)
  else if (data === 'inv_ingredients') await showIngredients(ctx)
  else if (data === 'inv_equipment') await showEquipmentInv(ctx)
  else if (data === 'inv_glyphs') await showGlyphs(ctx)
  else if (data === 'inv_close') await closeInventory(ctx)
})

// ========== ВАРКА ==========
bot.hears(/варка|крафт/i, showCraftMenu)
bot.command('craft', showCraftMenu)
bot.action(/craft_/, async (ctx) => craftHandler(ctx))

// ========== ПРОДАЖА ==========
bot.hears(/продажа|продать/i, showSellMenu)
bot.command('sell', showSellMenu)
bot.action(/sell_(.+)/, async (ctx) => handleSell(ctx, ctx.match[1]))

// ========== МАШИНЫ ==========
bot.hears(/машины|авто/i, showCars)
bot.command('cars', showCars)
bot.action(/^car_buy_/, async (ctx) => {
  const carId = ctx.callbackQuery.data.replace('car_buy_', '')
  await handleCarBuy(ctx, carId)
})
bot.action(/^car_activate_/, async (ctx) => {
  const carId = ctx.callbackQuery.data.replace('car_activate_', '')
  await handleCarActivate(ctx, carId)
})
bot.action('car_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== ОБОРУДОВАНИЕ ==========
bot.hears(/оборудование/i, showEquipment)
bot.command('equipment', showEquipment)
bot.action(/^eq_buy_/, async (ctx) => {
  const eqId = ctx.callbackQuery.data.replace('eq_buy_', '')
  await handleEquipmentBuy(ctx, eqId)
})
bot.action(/^eq_group_/, async (ctx) => {
  const groupId = ctx.callbackQuery.data.replace('eq_group_', '')
  await showEquipmentGroup(ctx, groupId)
})
bot.action('eq_back', async (ctx) => handleEquipmentBack(ctx))
bot.action('eq_close', async (ctx) => closeEquipment(ctx))

// ========== ТЮНИНГ ==========
bot.hears(/тюнинг/i, showTuning)
bot.command('tuning', showTuning)
bot.action(/^tuning_/, async (ctx) => {
  const tuningId = ctx.callbackQuery.data.replace('tuning_', '')
  await handleTuning(ctx, tuningId)
})
bot.action('tuning_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== БОКСЫ ==========
bot.hears(/боксы|бокс/i, showBoxes)
bot.command('boxes', showBoxes)
bot.action(/^box_/, async (ctx) => {
  const boxType = ctx.callbackQuery.data.replace('box_', '')
  await handleBox(ctx, boxType)
})

// ========== КАЗИНО ==========
bot.hears(/казино/i, showCasino)
bot.command('casino', showCasino)
bot.action(/^casino_/, async (ctx) => {
  const gameType = ctx.callbackQuery.data.replace('casino_', '')
  await handleCasino(ctx, gameType)
})

// ========== БИЗНЕС ==========
bot.hears(/бизнес/i, showBusiness)
bot.command('business', showBusiness)
bot.action(/^biz_buy_/, async (ctx) => {
  const bizId = ctx.callbackQuery.data.replace('biz_buy_', '')
  await handleBusinessBuy(ctx, bizId)
})
bot.action('biz_sell', async (ctx) => handleBusinessBuy(ctx, 'sell'))
bot.action('biz_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== РЕФЕРАЛЫ ==========
bot.hears(/рефералы|реф/i, showReferrals)
bot.command('referrals', showReferrals)
bot.action('ref_copy', async (ctx) => {
  await ctx.answerCbQuery()
  const { getPlayer, savePlayer } = require('../utils/db')
  const userId = ctx.from.id.toString()
  const player = await getPlayer(userId)
  let code = player.referralCode
  if (!code) {
    code = userId.slice(-6)
    await savePlayer(userId, { referralCode: code })
  }
  const link = `https://t.me/${ctx.botInfo.username}?start=ref_${code}`
  await ctx.reply(`📋 *ТВОЯ ССЫЛКА:*\n${link}`, { parse_mode: 'Markdown' })
})
bot.action('ref_claim', async (ctx) => claimReferralReward(ctx))
bot.action('ref_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== АЧИВКИ ==========
bot.hears(/ачивки|достижения/i, showAchievements)
bot.command('achievements', showAchievements)
bot.action(/^ach_/, async (ctx) => achievementHandler(ctx, ctx.callbackQuery.data))
bot.action(/^cat_/, async (ctx) => achievementHandler(ctx, ctx.callbackQuery.data))
bot.action(/^back_/, async (ctx) => achievementHandler(ctx, ctx.callbackQuery.data))
bot.action('ach_back', async (ctx) => achievementHandler(ctx, 'ach_back'))
bot.action('ach_close', async (ctx) => achievementHandler(ctx, 'ach_close'))

// ========== ЕЖЕДНЕВНЫЙ ==========
bot.hears(/ежедневный|бонус/i, showDaily)
bot.command('daily', showDaily)
bot.action('daily_claim', async (ctx) => claimDaily(ctx))

// ========== ГИЛЬДИЯ ==========
bot.hears(/гильдия/i, showGuild)
bot.command('guild', showGuild)
bot.action(/^guild_/, async (ctx) => {
  const action = ctx.callbackQuery.data.replace('guild_', '')
  await handleGuild(ctx, action)
})

// ========== ШАРДШОП ==========
bot.hears(/шардшоп|магазин осколков/i, showShardShop)
bot.command('shardshop', showShardShop)
bot.action(/^shard_buy_/, async (ctx) => {
  const itemId = ctx.callbackQuery.data.replace('shard_buy_', '')
  await handleShardBuy(ctx, itemId)
})
bot.action('shard_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== СКРЕЩИВАНИЕ ==========
bot.hears(/скрестить|скрещивание/i, showFusion)
bot.command('fusion', showFusion)
bot.action(/^fusion_select_/, async (ctx) => {
  const itemId = ctx.callbackQuery.data.replace('fusion_select_', '')
  await handleFusion(ctx, 'select', itemId)
})
bot.action(/^fusion_second_/, async (ctx) => {
  const itemId = ctx.callbackQuery.data.replace('fusion_second_', '')
  await handleFusion(ctx, 'second', itemId)
})
bot.action('fusion_cancel', async (ctx) => handleFusion(ctx, 'cancel', null))

// ========== РЕМОНТ ==========
bot.hears(/ремонт/i, showRepair)
bot.command('repair', showRepair)
bot.action(/^repair_/, async (ctx) => {
  const carId = ctx.callbackQuery.data.replace('repair_', '')
  await handleRepair(ctx, carId)
})
bot.action('repair_close', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()
})

// ========== ТОП ==========
bot.hears(/топ|лидеры/i, showLeaderboard)
bot.command('top', showLeaderboard)
bot.action(/^top_/, async (ctx) => {
  const action = ctx.callbackQuery.data
  await handleLeaderboard(ctx, action)
})

// ========== КВЕСТЫ ==========
bot.hears(/квесты|ежедневные/i, showDailyQuests)
bot.command('quests', showDailyQuests)
bot.action(/^quest_claim_/, async (ctx) => {
  const questId = ctx.callbackQuery.data.replace('quest_claim_', '')
  await claimQuest(ctx, questId)
})

// ========== ПОЛИЦИЯ ==========
bot.hears(/розыск/i, showWanted)
bot.command('wanted', showWanted)
bot.hears(/взятка/i, bribe)
bot.command('bribe', bribe)
bot.hears(/рейд/i, raid)
bot.command('raid', raid)

// ========== АДМИН ==========
bot.action(/^admin_/, async (ctx) => {
  await adminCallbackHandler(ctx, ctx.callbackQuery.data)
})

// ========== ТЕКСТОВЫЕ КОМАНДЫ ==========
bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase()
  
  if (text.startsWith('очко') || text.startsWith('бдж') || 
      text.startsWith('блэкджек') || text.startsWith('рул')) {
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
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body)
      res.status(200).send('OK')
    } catch (err) {
      console.error('Webhook error:', err)
      res.status(500).send('Error')
    }
  } else {
    res.status(200).send('Dark Lab Bot is running!')
  }
}