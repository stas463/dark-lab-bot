// handlers/dailyQuests.js
const { getPlayer, savePlayer, addExp } = require('../utils/db')

const QUESTS = [
  { id: 'craft_3', name: '🔬 Свари 3 наркотика', target: 3, rewardExp: 100, rewardShards: 5, rewardMoney: 5000 },
  { id: 'sell_5', name: '💰 Продай 5 раз', target: 5, rewardExp: 100, rewardShards: 5, rewardMoney: 5000 },
  { id: 'win_casino', name: '🎰 Выиграй в казино 2 раза', target: 2, rewardExp: 150, rewardShards: 10, rewardMoney: 10000 }
]

async function showDailyQuests(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const questsProgress = player.questsProgress || {}
  const lastQuestReset = player.lastQuestReset || 0
  const now = Date.now()
  
  if (now - lastQuestReset > 24 * 60 * 60 * 1000) {
    const newProgress = {}
    for (const quest of QUESTS) {
      newProgress[quest.id] = 0
    }
    savePlayer(userId, { questsProgress: newProgress, lastQuestReset: now })
  }
  
  let message = '📋 *Ежедневные квесты*\n\n'
  const buttons = []
  
  for (const quest of QUESTS) {
    const progress = questsProgress[quest.id] || 0
    const completed = progress >= quest.target
    message += `${completed ? '✅' : '❌'} *${quest.name}*\n`
    message += `   Прогресс: ${progress}/${quest.target}\n`
    message += `   Награда: +${quest.rewardExp} EXP, ${quest.rewardShards}💎, $${quest.rewardMoney}\n\n`
    if (completed && !(player.questsClaimed || {})[quest.id]) {
      buttons.push([{ text: `🎁 Забрать награду за ${quest.name}`, callback_data: `quest_claim_${quest.id}` }])
    }
  }
  
  if (buttons.length > 0) {
    const keyboard = { reply_markup: { inline_keyboard: buttons } }
    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
  } else {
    await ctx.reply(message, { parse_mode: 'Markdown' })
  }
}

async function claimQuest(ctx, questId) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const quest = QUESTS.find(q => q.id === questId)
  if (!quest) return
  
  const progress = (player.questsProgress || {})[questId] || 0
  const claimed = (player.questsClaimed || {})[questId] || false
  
  if (progress < quest.target || claimed) {
    await ctx.answerCbQuery('❌ Квест ещё не выполнен или награда уже получена!')
    return
  }
  
  addExp(userId, quest.rewardExp)
  savePlayer(userId, {
    balance: (player.balance || 0) + quest.rewardMoney,
    shards: (player.shards || 0) + quest.rewardShards,
    questsClaimed: { ...(player.questsClaimed || {}), [questId]: true }
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`🎉 *Награда получена!*\n✨ +${quest.rewardExp} EXP\n💰 +$${quest.rewardMoney}\n💎 +${quest.rewardShards} осколков`, { parse_mode: 'Markdown' })
}

module.exports = { showDailyQuests, claimQuest }