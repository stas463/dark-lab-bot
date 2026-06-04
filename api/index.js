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
  console.error('❌ Ошибка бота:', err.message)
})

// ========== ПРИВЕТСТВИЕ ==========
bot.start(async (ctx) => {
  console.log('✅ /start от', ctx.from.id)
  const { getPlayer } = require('../utils/db')
  await getPlayer(ctx.from.id.toString(), ctx.from.first_name)
  await ctx.reply(`🔬 *ТЁМНАЯ ЛАБОРАТОРИЯ*\n\nДобро пожаловать, ${ctx.from.first_name}!\n\nНапиши /help для списка команд`, { parse_mode: 'Markdown' })
})

// ========== ID ==========
bot.command('id', async (ctx) => {
  await ctx.reply(`🆔 *ТВОЙ ID:* \`${ctx.from.id}\``, { parse_mode: 'Markdown' })
})

// ========== ПОМОЩЬ ==========
bot.hears(/помощь/i, showHelp)
bot.command('help', showHelp)

// ========== ПРОФИЛЬ ==========
bot.hears(/профиль/i, showProfile)
bot.command('profile', showProfile)

// ========== МАГАЗИН ==========
bot.hears(/магазин/i, showShop)
bot.command('shop', showShop)

// ========== ИНВЕНТАРЬ ==========
bot.hears(/инвентарь/i, showInventory)
bot.command('inventory', showInventory)

// ========== ВАРКА ==========
bot.hears(/варка|крафт/i, showCraftMenu)
bot.command('craft', showCraftMenu)

// ========== ПРОДАЖА ==========
bot.hears(/продажа|продать/i, showSellMenu)
bot.command('sell', showSellMenu)

// ========== МАШИНЫ ==========
bot.hears(/машины|авто/i, showCars)
bot.command('cars', showCars)

// ========== ОБОРУДОВАНИЕ ==========
bot.hears(/оборудование/i, showEquipment)
bot.command('equipment', showEquipment)

// ========== ТЮНИНГ ==========
bot.hears(/тюнинг/i, showTuning)
bot.command('tuning', showTuning)

// ========== БОКСЫ ==========
bot.hears(/боксы|бокс/i, showBoxes)
bot.command('boxes', showBoxes)

// ========== КАЗИНО ==========
bot.hears(/казино/i, showCasino)
bot.command('casino', showCasino)

// ========== БИЗНЕС ==========
bot.hears(/бизнес/i, showBusiness)
bot.command('business', showBusiness)

// ========== РЕФЕРАЛЫ ==========
bot.hears(/рефералы|реф/i, showReferrals)
bot.command('referrals', showReferrals)

// ========== АЧИВКИ ==========
bot.hears(/ачивки|достижения/i, showAchievements)
bot.command('achievements', showAchievements)

// ========== ЕЖЕДНЕВНЫЙ ==========
bot.hears(/ежедневный|бонус/i, showDaily)
bot.command('daily', showDaily)

// ========== ГИЛЬДИЯ ==========
bot.hears(/гильдия/i, showGuild)
bot.command('guild', showGuild)

// ========== ШАРДШОП ==========
bot.hears(/шардшоп|магазин осколков/i, showShardShop)
bot.command('shardshop', showShardShop)

// ========== СКРЕЩИВАНИЕ ==========
bot.hears(/скрестить|скрещивание/i, showFusion)
bot.command('fusion', showFusion)

// ========== РЕМОНТ ==========
bot.hears(/ремонт/i, showRepair)
bot.command('repair', showRepair)

// ========== ТОП ==========
bot.hears(/топ|лидеры/i, showLeaderboard)
bot.command('top', showLeaderboard)

// ========== КВЕСТЫ ==========
bot.hears(/квесты|ежедневные/i, showDailyQuests)
bot.command('quests', showDailyQuests)

// ========== ПОЛИЦИЯ ==========
bot.hears(/розыск/i, showWanted)
bot.command('wanted', showWanted)
bot.hears(/взятка/i, bribe)
bot.command('bribe', bribe)
bot.hears(/рейд/i, raid)
bot.command('raid', raid)

// ========== КНОПКИ (callback) ==========
bot.action(/help_/, async (ctx) => handleHelpButtons(ctx, ctx.callbackQuery.data))
bot.action('help_back', async (ctx) => handleHelpBack(ctx))
bot.action('help_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

bot.action(/drug_/, async (ctx) => shopHandler(ctx, ctx.callbackQuery.data))
bot.action(/buy_/, async (ctx) => shopHandler(ctx, ctx.callbackQuery.data))
bot.action('drug_back', async (ctx) => shopHandler(ctx, 'drug_back'))
bot.action('drug_close', async (ctx) => shopHandler(ctx, 'drug_close'))

bot.action(/inv_/, async (ctx) => {
  const data = ctx.callbackQuery.data
  if (data === 'inv_drugs') await showDrugs(ctx)
  else if (data === 'inv_ingredients') await showIngredients(ctx)
  else if (data === 'inv_equipment') await showEquipmentInv(ctx)
  else if (data === 'inv_glyphs') await showGlyphs(ctx)
  else if (data === 'inv_close') await closeInventory(ctx)
})

bot.action(/craft_/, async (ctx) => craftHandler(ctx))

bot.action(/sell_(.+)/, async (ctx) => handleSell(ctx, ctx.match[1]))

bot.action(/^car_buy_/, async (ctx) => handleCarBuy(ctx, ctx.callbackQuery.data.replace('car_buy_', '')))
bot.action(/^car_activate_/, async (ctx) => handleCarActivate(ctx, ctx.callbackQuery.data.replace('car_activate_', '')))
bot.action('car_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

bot.action(/^eq_buy_/, async (ctx) => handleEquipmentBuy(ctx, ctx.callbackQuery.data.replace('eq_buy_', '')))
bot.action(/^eq_group_/, async (ctx) => showEquipmentGroup(ctx, ctx.callbackQuery.data.replace('eq_group_', '')))
bot.action('eq_back', async (ctx) => handleEquipmentBack(ctx))
bot.action('eq_close', async (ctx) => closeEquipment(ctx))

bot.action(/^tuning_/, async (ctx) => handleTuning(ctx, ctx.callbackQuery.data.replace('tuning_', '')))
bot.action('tuning_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

bot.action(/^box_/, async (ctx) => handleBox(ctx, ctx.callbackQuery.data.replace('box_', '')))

bot.action(/^casino_/, async (ctx) => handleCasino(ctx, ctx.callbackQuery.data.replace('casino_', '')))

bot.action(/^biz_buy_/, async (ctx) => handleBusinessBuy(ctx, ctx.callbackQuery.data.replace('biz_buy_', '')))
bot.action('biz_sell', async (ctx) => handleBusinessBuy(ctx, 'sell'))
bot.action('biz_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

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
bot.action('ref_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

bot.action(/^ach_/, async (ctx) => achievementHandler(ctx, ctx.callbackQuery.data))
bot.action(/^cat_/, async (ctx) => achievementHandler(ctx, ctx.callbackQuery.data))
bot.action(/^back_/, async (ctx) => achievementHandler(ctx, ctx.callbackQuery.data))
bot.action('ach_back', async (ctx) => achievementHandler(ctx, 'ach_back'))
bot.action('ach_close', async (ctx) => achievementHandler(ctx, 'ach_close'))

bot.action('daily_claim', async (ctx) => claimDaily(ctx))

bot.action(/^guild_/, async (ctx) => handleGuild(ctx, ctx.callbackQuery.data.replace('guild_', '')))

bot.action(/^shard_buy_/, async (ctx) => handleShardBuy(ctx, ctx.callbackQuery.data.replace('shard_buy_', '')))
bot.action('shard_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

bot.action(/^fusion_select_/, async (ctx) => handleFusion(ctx, 'select', ctx.callbackQuery.data.replace('fusion_select_', '')))
bot.action(/^fusion_second_/, async (ctx) => handleFusion(ctx, 'second', ctx.callbackQuery.data.replace('fusion_second_', '')))
bot.action('fusion_cancel', async (ctx) => handleFusion(ctx, 'cancel', null))

bot.action(/^repair_/, async (ctx) => handleRepair(ctx, ctx.callbackQuery.data.replace('repair_', '')))
bot.action('repair_close', async (ctx) => { await ctx.answerCbQuery(); await ctx.deleteMessage() })

bot.action(/^top_/, async (ctx) => handleLeaderboard(ctx, ctx.callbackQuery.data))

bot.action(/^quest_claim_/, async (ctx) => claimQuest(ctx, ctx.callbackQuery.data.replace('quest_claim_', '')))

bot.action(/^admin_/, async (ctx) => adminCallbackHandler(ctx, ctx.callbackQuery.data))

// Кнопки блэкджека
bot.action('bj_hit', async (ctx) => handleHit(ctx))
bot.action('bj_stand', async (ctx) => handleStand(ctx))

// ========== ТЕКСТОВЫЕ КОМАНДЫ ==========
bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase()
  console.log(`📩 Текст от ${ctx.from.id}: ${text}`)
  
  if (text.startsWith('очко') || text.startsWith('бдж') || text.startsWith('блэкджек') || text.startsWith('рул')) {
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
  console.log(`📨 Получен ${req.method} запрос`)
  
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body)
      res.status(200).send('OK')
    } catch (err) {
      console.error('❌ Ошибка:', err.message)
      res.status(500).send(`Error: ${err.message}`)
    }
  } else {
    res.status(200).send('Dark Lab Bot is running!')
  }
}
