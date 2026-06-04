// handlers/casino.js
const { getPlayer, savePlayer } = require('../utils/db')
const { checkAchievements } = require('./achievements')

// Хранилище активных игр
const activeGames = new Map()

// Эмодзи для мастей
function getRandomSuit() {
  const suits = ['♥️', '♦️', '♣️', '♠️']
  return suits[Math.floor(Math.random() * suits.length)]
}

// Получить карту с мастью
function getCard() {
  const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const card = cards[Math.floor(Math.random() * cards.length)]
  let value = 0
  if (card === 'A') value = 11
  else if (['K', 'Q', 'J'].includes(card)) value = 10
  else value = parseInt(card)
  const suit = getRandomSuit()
  return { card, value, display: `${card}${suit}` }
}

// Форматирование карт для вывода
function formatCards(cards) {
  return cards.map(c => c.display).join(' · ')
}

// ========== БЛЭКДЖЕК С КНОПКАМИ ==========
async function handleBlackjack(ctx, bet) {
  const userId = ctx.from.id.toString()
  
  if (activeGames.has(userId)) {
    await ctx.reply(`⏳ *У ТЕБЯ УЖЕ ЕСТЬ АКТИВНАЯ ИГРА!*`, { parse_mode: 'Markdown' })
    return
  }
  
  const player = await getPlayer(userId)
  
  if (player.balance < bet) {
    await ctx.reply(`❌ НЕ ХВАТАЕТ ДЕНЕГ!\n💰 НУЖНО: $${bet}\n💰 ЕСТЬ: $${player.balance}`)
    return
  }
  
  // Начинаем игру
  const playerCards = [getCard(), getCard()]
  const dealerCards = [getCard()]
  
  let playerValue = playerCards.reduce((sum, c) => sum + c.value, 0)
  if (playerValue > 21 && playerCards.some(c => c.card === 'A')) playerValue -= 10
  
  // Сохраняем состояние игры
  activeGames.set(userId, {
    bet,
    playerCards,
    dealerCards,
    playerValue,
    balance: player.balance
  })
  
  // Отправляем сообщение с кнопками
  await showGameMessage(ctx, userId)
}

async function showGameMessage(ctx, userId) {
  const game = activeGames.get(userId)
  if (!game) return
  
  const player = await getPlayer(userId)
  const dealerValue = game.dealerCards[0].value
  
  let message = `🎰 *БЛЭКДЖЕК* 🎰\n\n`
  message += `*СТАВКА:* ${game.bet} $\n\n`
  message += `┌─────────────────────┐\n`
  message += `│ *ДИЛЕР:* ${formatCards(game.dealerCards)} | ? │\n`
  message += `├─────────────────────┤\n`
  message += `│ *ТЫ:* ${formatCards(game.playerCards)} │\n`
  message += `└─────────────────────┘\n\n`
  message += `📊 *СЧЁТ:* ${game.playerValue}`
  
  if (game.playerValue === 21 && game.playerCards.length === 2) {
    message += ` (БЛЭКДЖЕК!)\n\n✅ *ТЫ ПОБЕДИЛ!*`
    const winAmount = game.bet * 2.5
    await savePlayer(userId, { balance: player.balance - game.bet + winAmount })
    await ctx.reply(message, { parse_mode: 'Markdown' })
    activeGames.delete(userId)
    return
  }
  
  if (game.playerValue > 21) {
    message += `\n\n💀 *ПЕРЕБОР! ТЫ ПРОИГРАЛ!* 💀`
    await savePlayer(userId, { balance: player.balance - game.bet })
    await ctx.reply(message, { parse_mode: 'Markdown' })
    activeGames.delete(userId)
    return
  }
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎴 ЕЩЕ', callback_data: `bj_hit_${userId}` },
          { text: '🛑 СТОП', callback_data: `bj_stand_${userId}` }
        ]
      ]
    }
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard })
}

async function handleHit(ctx, userId) {
  const game = activeGames.get(userId)
  if (!game) {
    await ctx.answerCbQuery('❌ ИГРА ЗАКОНЧЕНА!')
    return
  }
  
  const newCard = getCard()
  game.playerCards.push(newCard)
  game.playerValue += newCard.value
  
  if (game.playerValue > 21 && game.playerCards.some(c => c.card === 'A')) {
    game.playerValue -= 10
  }
  
  activeGames.set(userId, game)
  await showGameMessage(ctx, userId)
}

async function handleStand(ctx, userId) {
  const game = activeGames.get(userId)
  if (!game) {
    await ctx.answerCbQuery('❌ ИГРА ЗАКОНЧЕНА!')
    return
  }
  
  // Ход дилера
  while (game.dealerValue < 17) {
    const newCard = getCard()
    game.dealerCards.push(newCard)
    game.dealerValue += newCard.value
    if (game.dealerValue > 21 && game.dealerCards.some(c => c.card === 'A')) {
      game.dealerValue -= 10
    }
  }
  
  let message = `🎰 *БЛЭКДЖЕК* 🎰\n\n`
  message += `*СТАВКА:* ${game.bet} $\n\n`
  message += `┌─────────────────────┐\n`
  message += `│ *ДИЛЕР:* ${formatCards(game.dealerCards)} | ${game.dealerValue} │\n`
  message += `├─────────────────────┤\n`
  message += `│ *ТЫ:* ${formatCards(game.playerCards)} | ${game.playerValue} │\n`
  message += `└─────────────────────┘\n\n`
  
  let result = ''
  let win = false
  let winAmount = 0
  
  if (game.dealerValue > 21) {
    win = true
    winAmount = game.bet * 2
    result = `🎉 *ДИЛЕР ПЕРЕБРАЛ! ТЫ ВЫИГРАЛ ${winAmount}$!* 🎉`
  } else if (game.playerValue > game.dealerValue) {
    win = true
    winAmount = game.bet * 2
    result = `🎉 *ТЫ ВЫИГРАЛ!* ${winAmount}$ 🎉`
  } else if (game.playerValue < game.dealerValue) {
    win = false
    result = `💀 *ТЫ ПРОИГРАЛ!* ${game.bet}$ 💀`
  } else {
    win = true
    winAmount = game.bet
    result = `🤝 *НИЧЬЯ!* ТЕБЕ ВЕРНУЛИ ${game.bet}$. 🤝`
  }
  
  const player = await getPlayer(userId)
  
  if (win) {
    await savePlayer(userId, { balance: player.balance - game.bet + winAmount })
  } else {
    await savePlayer(userId, { balance: player.balance - game.bet })
  }
  
  const stats = player.achievementStats || {}
  stats.casino_bet = (stats.casino_bet || 0) + 1
  if (win) stats.casino_wins = (stats.casino_wins || 0) + 1
  await savePlayer(userId, { achievementStats: stats })
  await checkAchievements(userId, 'casino_bet', 1)
  if (win) await checkAchievements(userId, 'casino_wins', 1)
  
  await ctx.editMessageText(message + result, { parse_mode: 'Markdown' })
  activeGames.delete(userId)
}

// ========== РУЛЕТКА ==========
async function handleRoulette(ctx, bet, betType, betValue) {
  const userId = ctx.from.id.toString()
  const player = await getPlayer(userId)
  
  if (player.balance < bet) {
    await ctx.reply(`❌ НЕ ХВАТАЕТ ДЕНЕГ!\n💰 НУЖНО: $${bet}\n💰 ЕСТЬ: $${player.balance}`)
    return
  }
  
  const number = Math.floor(Math.random() * 37)
  const color = number === 0 ? 'zero' : (number % 2 === 0 ? 'black' : 'red')
  const colorEmoji = color === 'zero' ? '🟢' : (color === 'red' ? '🔴' : '⚫')
  const colorName = color === 'zero' ? 'ЗЕРО' : (color === 'red' ? 'КРАСНОЕ' : 'ЧЁРНОЕ')
  
  let win = false
  let multiplier = 0
  
  switch (betType) {
    case 'color':
      if ((betValue === 'красное' && color === 'red') ||
          (betValue === 'черное' && color === 'black')) {
        win = true
        multiplier = 2
      }
      break
    case 'evenodd':
      if (number !== 0) {
        if ((betValue === 'четное' && number % 2 === 0) ||
            (betValue === 'нечетное' && number % 2 === 1)) {
          win = true
          multiplier = 2
        }
      }
      break
    case 'row':
      const row = betValue === '1' ? [1,4,7,10,13,16,19,22,25,28,31,34] :
                  betValue === '2' ? [2,5,8,11,14,17,20,23,26,29,32,35] :
                  [3,6,9,12,15,18,21,24,27,30,33,36]
      if (row.includes(number)) {
        win = true
        multiplier = 3
      }
      break
    case 'column':
      const col = betValue === '1' ? [1,2,3,4,5,6,7,8,9,10,11,12] :
                  betValue === '2' ? [13,14,15,16,17,18,19,20,21,22,23,24] :
                  [25,26,27,28,29,30,31,32,33,34,35,36]
      if (col.includes(number)) {
        win = true
        multiplier = 3
      }
      break
    case 'half':
      if ((betValue === '1-18' && number >= 1 && number <= 18) ||
          (betValue === '19-36' && number >= 19 && number <= 36)) {
        win = true
        multiplier = 2
      }
      break
    case 'exact':
      if (number === parseInt(betValue)) {
        win = true
        multiplier = 36
      }
      break
    case 'zero':
      if (number === 0) {
        win = true
        multiplier = 36
      }
      break
  }
  
  const winAmount = win ? bet * multiplier : 0
  const stats = player.achievementStats || {}
  stats.casino_bet = (stats.casino_bet || 0) + 1
  
  let resultMessage = `🎡 *РУЛЕТКА*\n\n${colorEmoji} ВЫПАЛО: ${number} (${colorName})\n\n`
  
  if (win) {
    resultMessage += `✅ *ПОБЕДА!* ТЫ ВЫИГРАЛ $${winAmount}! (x${multiplier}) ✅`
    await savePlayer(userId, { balance: player.balance - bet + winAmount, achievementStats: stats })
    stats.casino_wins = (stats.casino_wins || 0) + 1
    await checkAchievements(userId, 'casino_wins', 1)
  } else {
    resultMessage += `❌ *ПРОИГРЫШ!* ТЫ ПРОИГРАЛ $${bet}. ❌`
    await savePlayer(userId, { balance: player.balance - bet, achievementStats: stats })
  }
  
  await checkAchievements(userId, 'casino_bet', 1)
  await ctx.reply(resultMessage, { parse_mode: 'Markdown' })
}

// ========== КОМАНДЫ ==========
async function handleCasinoCommand(ctx) {
  const text = ctx.message.text.toLowerCase()
  
  const bjMatch = text.match(/^(?:очко|бдж|блэкджек)\s+(\d+)$/i)
  if (bjMatch) {
    const bet = parseInt(bjMatch[1])
    if (bet < 1) {
      await ctx.reply('❌ МИНИМАЛЬНАЯ СТАВКА: $1')
      return
    }
    await handleBlackjack(ctx, bet)
    return
  }
  
  const rouletteMatch = text.match(/^рул(?:етка)?\s+(красное|кра|черное|чер|четное|чет|нечетное|неч|1-18|19-36|ряд[123]|столб[123]|\d+|зеро|0)\s+(\d+)$/i)
  if (rouletteMatch) {
    let betValue = rouletteMatch[1].toLowerCase()
    const bet = parseInt(rouletteMatch[2])
    
    if (bet < 1) {
      await ctx.reply('❌ МИНИМАЛЬНАЯ СТАВКА: $1')
      return
    }
    
    if (betValue === 'кра') betValue = 'красное'
    if (betValue === 'чер') betValue = 'черное'
    if (betValue === 'чет') betValue = 'четное'
    if (betValue === 'неч') betValue = 'нечетное'
    if (betValue === '0') betValue = 'зеро'
    
    if (betValue === '1-18') { await handleRoulette(ctx, bet, 'half', '1-18'); return }
    if (betValue === '19-36') { await handleRoulette(ctx, bet, 'half', '19-36'); return }
    if (betValue.match(/^ряд[123]$/)) { await handleRoulette(ctx, bet, 'row', betValue.replace('ряд', '')); return }
    if (betValue.match(/^столб[123]$/)) { await handleRoulette(ctx, bet, 'column', betValue.replace('столб', '')); return }
    if (betValue === 'красное' || betValue === 'черное') { await handleRoulette(ctx, bet, 'color', betValue); return }
    if (betValue === 'четное' || betValue === 'нечетное') { await handleRoulette(ctx, bet, 'evenodd', betValue); return }
    if (betValue === 'зеро') { await handleRoulette(ctx, bet, 'zero', null); return }
    
    const num = parseInt(betValue)
    if (num >= 0 && num <= 36) {
      if (num === 0) await handleRoulette(ctx, bet, 'zero', null)
      else await handleRoulette(ctx, bet, 'exact', num)
      return
    }
    
    await ctx.reply(`❌ НЕВЕРНАЯ СТАВКА!`)
    return
  }
  
  await ctx.reply(`🎰 *КАЗИНО* 🎰\n\n*КОМАНДЫ:*\n\n🃏 *БЛЭКДЖЕК (ОЧКО)*\nочко 100 — начать игру\n\n🎡 *РУЛЕТКА*\nрул кра 100 — на красное\nрул чер 100 — на чёрное\nрул чет 100 — на чётное\nрул неч 100 — на нечётное\nрул 1-18 100\nрул 19-36 100\nрул ряд1 100\nрул столб2 100\nрул 7 100\nрул зеро 100\n\n💰 *МИНИМАЛЬНАЯ СТАВКА: $1*`, { parse_mode: 'Markdown' })
}

async function showCasino(ctx) {
  await ctx.reply(`🎰 *КАЗИНО* 🎰\n\n*КОМАНДЫ:*\n\n🃏 *БЛЭКДЖЕК (ОЧКО)*\nочко 100 — начать игру\n\n🎡 *РУЛЕТКА*\nрул кра 100 — на красное\nрул чер 100 — на чёрное\nрул чет 100 — на чётное\nрул неч 100 — на нечётное\nрул 1-18 100\nрул 19-36 100\nрул ряд1 100\nрул столб2 100\nрул 7 100\nрул зеро 100\n\n💰 *МИНИМАЛЬНАЯ СТАВКА: $1*`, { parse_mode: 'Markdown' })
}

async function handleCasino(ctx, gameType) {
  if (gameType === 'cancel' || gameType === 'casino_cancel') {
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌ ИГРА ОТМЕНЕНА.')
    return
  }
  await ctx.answerCbQuery('ИСПОЛЬЗУЙ ТЕКСТОВЫЕ КОМАНДЫ! НАПИШИ /casino')
}

module.exports = { showCasino, handleCasino, handleCasinoCommand, handleHit, handleStand }
