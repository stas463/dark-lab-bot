// handlers/casino.js
const { getPlayer, savePlayer } = require('../utils/db')
const { checkAchievements } = require('./achievements')

// ========== РУЛЕТКА (ОДНИМ СООБЩЕНИЕМ) ==========
async function handleRoulette(ctx, bet, betType, betValue) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if (player.balance < bet) {
    await ctx.reply(`❌ НЕ ХВАТАЕТ ДЕНЕГ!\n💰 НУЖНО: $${bet}\n💰 ЕСТЬ: $${player.balance}`)
    return
  }
  
  // ГЕНЕРИРУЕМ ВЫПАВШЕЕ ЧИСЛО
  const number = Math.floor(Math.random() * 37)
  const color = number === 0 ? 'zero' : (number % 2 === 0 ? 'black' : 'red')
  const colorEmoji = color === 'zero' ? '🟢' : (color === 'red' ? '🔴' : '⚫')
  const colorName = color === 'zero' ? 'ЗЕРО' : (color === 'red' ? 'КРАСНОЕ' : 'ЧЁРНОЕ')
  
  let win = false
  let multiplier = 0
  
  // ОПРЕДЕЛЯЕМ ВЫИГРЫШ
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
  
  // ФОРМИРУЕМ ОТВЕТ ОДНИМ СООБЩЕНИЕМ
  let resultMessage = `🎡 *РУЛЕТКА*\n\n`
  resultMessage += `${colorEmoji} ВЫПАЛО: ${number} (${colorName})\n\n`
  
  if (win) {
    resultMessage += `✅ *ПОБЕДА!* ТЫ ВЫИГРАЛ $${winAmount}! (x${multiplier}) ✅`
  } else {
    resultMessage += `❌ *ПРОИГРЫШ!* ТЫ ПРОИГРАЛ $${bet}. ❌`
  }
  
  // ОБНОВЛЯЕМ БАЛАНС
  const stats = player.achievementStats || {}
  stats.casino_bet = (stats.casino_bet || 0) + 1
  
  if (win) {
    savePlayer(userId, { balance: player.balance - bet + winAmount, achievementStats: stats })
    stats.casino_wins = (stats.casino_wins || 0) + 1
    await checkAchievements(userId, 'casino_wins', 1)
  } else {
    savePlayer(userId, { balance: player.balance - bet, achievementStats: stats })
  }
  
  await checkAchievements(userId, 'casino_bet', 1)
  await ctx.reply(resultMessage, { parse_mode: 'Markdown' })
}

// ========== БЛЭКДЖЕК (ОЧКО) ==========
async function handleBlackjack(ctx, bet) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  
  if (player.balance < bet) {
    await ctx.reply(`❌ НЕ ХВАТАЕТ ДЕНЕГ!\n💰 НУЖНО: $${bet}\n💰 ЕСТЬ: $${player.balance}`)
    return
  }
  
  function getCard() {
    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const card = cards[Math.floor(Math.random() * cards.length)]
    let value = 0
    if (card === 'A') value = 11
    else if (['K', 'Q', 'J'].includes(card)) value = 10
    else value = parseInt(card)
    return { card, value }
  }
  
  const playerCards = [getCard(), getCard()]
  const dealerCards = [getCard(), getCard()]
  
  let playerValue = playerCards.reduce((sum, c) => sum + c.value, 0)
  let dealerValue = dealerCards.reduce((sum, c) => sum + c.value, 0)
  
  if (playerValue > 21 && playerCards.some(c => c.card === 'A')) playerValue -= 10
  if (dealerValue > 21 && dealerCards.some(c => c.card === 'A')) dealerValue -= 10
  
  let message = `🃏 *БЛЭКДЖЕК (ОЧКО)*\n💰 СТАВКА: $${bet}\n\n`
  message += `🎴 ТВОИ КАРТЫ: ${playerCards.map(c => c.card).join(' ')} = ${playerValue}\n`
  message += `🎴 КАРТЫ ДИЛЕРА: ${dealerCards[0].card} | ?\n\n`
  
  if (playerValue === 21) {
    const winAmount = bet * 2.5
    savePlayer(userId, { balance: player.balance - bet + winAmount })
    message += `🎉 *БЛЭКДЖЕК!* ТЫ ВЫИГРАЛ $${winAmount}! 🎉`
    await ctx.reply(message, { parse_mode: 'Markdown' })
    return
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown' })
  
  let standing = false
  while (!standing && playerValue < 21) {
    await ctx.reply(`🎴 ЕЩЁ КАРТУ? НАПИШИ "ДА" ИЛИ "НЕТ"`)
    
    const response = await new Promise(resolve => {
      const handler = (msg) => {
        if (msg.chat.id === ctx.chat.id) {
          const text = msg.text.toLowerCase()
          if (text === 'да' || text === 'нет') {
            ctx.bot.off('text', handler)
            resolve(text)
          }
        }
      }
      ctx.bot.on('text', handler)
      setTimeout(() => {
        ctx.bot.off('text', handler)
        resolve('нет')
      }, 30000)
    })
    
    if (response === 'да') {
      const newCard = getCard()
      playerCards.push(newCard)
      playerValue += newCard.value
      if (playerValue > 21 && playerCards.some(c => c.card === 'A')) playerValue -= 10
      
      message = `🃏 *БЛЭКДЖЕК (ОЧКО)*\n💰 СТАВКА: $${bet}\n\n`
      message += `🎴 ТВОИ КАРТЫ: ${playerCards.map(c => c.card).join(' ')} = ${playerValue}\n`
      message += `🎴 КАРТЫ ДИЛЕРА: ${dealerCards[0].card} | ?\n\n`
      await ctx.reply(message, { parse_mode: 'Markdown' })
      
      if (playerValue > 21) {
        savePlayer(userId, { balance: player.balance - bet })
        await ctx.reply(`💀 *ПЕРЕБОР!* ТЫ ПРОИГРАЛ $${bet}. 💀`, { parse_mode: 'Markdown' })
        return
      }
    } else {
      standing = true
    }
  }
  
  while (dealerValue < 17) {
    const newCard = getCard()
    dealerCards.push(newCard)
    dealerValue += newCard.value
    if (dealerValue > 21 && dealerCards.some(c => c.card === 'A')) dealerValue -= 10
  }
  
  message = `🃏 *БЛЭКДЖЕК (ОЧКО)*\n💰 СТАВКА: $${bet}\n\n`
  message += `🎴 ТВОИ КАРТЫ: ${playerCards.map(c => c.card).join(' ')} = ${playerValue}\n`
  message += `🎴 КАРТЫ ДИЛЕРА: ${dealerCards.map(c => c.card).join(' ')} = ${dealerValue}\n\n`
  
  let result = ''
  let win = false
  let winAmount = 0
  
  if (dealerValue > 21) {
    win = true
    winAmount = bet * 2
    result = `🎉 *ДИЛЕР ПЕРЕБРАЛ!* ТЫ ВЫИГРАЛ $${winAmount}! 🎉`
  } else if (playerValue > dealerValue) {
    win = true
    winAmount = bet * 2
    result = `🎉 *ТЫ ВЫИГРАЛ!* $${winAmount}! 🎉`
  } else if (playerValue < dealerValue) {
    win = false
    result = `💀 *ТЫ ПРОИГРАЛ!* $${bet}. 💀`
  } else {
    win = true
    winAmount = bet
    result = `🤝 *НИЧЬЯ!* ВОЗВРАЩАЮ $${bet}. 🤝`
  }
  
  const stats = player.achievementStats || {}
  stats.casino_bet = (stats.casino_bet || 0) + 1
  
  if (win) {
    savePlayer(userId, { balance: player.balance - bet + winAmount, achievementStats: stats })
    stats.casino_wins = (stats.casino_wins || 0) + 1
    await checkAchievements(userId, 'casino_wins', 1)
  } else {
    savePlayer(userId, { balance: player.balance - bet, achievementStats: stats })
  }
  
  await checkAchievements(userId, 'casino_bet', 1)
  await ctx.reply(message + result, { parse_mode: 'Markdown' })
}

// ========== КОМАНДЫ ==========
async function handleCasinoCommand(ctx) {
  const text = ctx.message.text.toLowerCase()
  
  // БЛЭКДЖЕК: очко 100
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
  
  // РУЛЕТКА: рул кра 100
  const rouletteMatch = text.match(/^рул(?:етка)?\s+(красное|кра|черное|чер|четное|чет|нечетное|неч|1-18|19-36|ряд[123]|столб[123]|\d+|зеро|0)\s+(\d+)$/i)
  if (rouletteMatch) {
    let betValue = rouletteMatch[1].toLowerCase()
    const bet = parseInt(rouletteMatch[2])
    
    if (bet < 1) {
      await ctx.reply('❌ МИНИМАЛЬНАЯ СТАВКА: $1')
      return
    }
    
    // Нормализация коротких команд
    if (betValue === 'кра') betValue = 'красное'
    if (betValue === 'чер') betValue = 'черное'
    if (betValue === 'чет') betValue = 'четное'
    if (betValue === 'неч') betValue = 'нечетное'
    if (betValue === '0') betValue = 'зеро'
    
    // Половины поля
    if (betValue === '1-18') {
      await handleRoulette(ctx, bet, 'half', '1-18')
      return
    }
    if (betValue === '19-36') {
      await handleRoulette(ctx, bet, 'half', '19-36')
      return
    }
    
    // Ряды
    if (betValue.match(/^ряд[123]$/)) {
      const row = betValue.replace('ряд', '')
      await handleRoulette(ctx, bet, 'row', row)
      return
    }
    
    // Столбцы
    if (betValue.match(/^столб[123]$/)) {
      const col = betValue.replace('столб', '')
      await handleRoulette(ctx, bet, 'column', col)
      return
    }
    
    // Цвета
    if (betValue === 'красное' || betValue === 'черное') {
      await handleRoulette(ctx, bet, 'color', betValue)
      return
    }
    
    // Чёт/нечет
    if (betValue === 'четное' || betValue === 'нечетное') {
      await handleRoulette(ctx, bet, 'evenodd', betValue)
      return
    }
    
    // Зеро
    if (betValue === 'зеро') {
      await handleRoulette(ctx, bet, 'zero', null)
      return
    }
    
    // Конкретное число
    const num = parseInt(betValue)
    if (num >= 0 && num <= 36) {
      if (num === 0) {
        await handleRoulette(ctx, bet, 'zero', null)
      } else {
        await handleRoulette(ctx, bet, 'exact', num)
      }
      return
    }
    
    await ctx.reply(`❌ НЕВЕРНАЯ СТАВКА!\n\nДОСТУПНО:\n• красное/кра\n• черное/чер\n• четное/чет\n• нечетное/неч\n• 1-18 / 19-36\n• ряд1/ряд2/ряд3\n• столб1/столб2/столб3\n• число 0-36\n• зеро`)
    return
  }
  
  await ctx.reply(`🎰 *КАЗИНО* 🎰\n\n*КОМАНДЫ:*\n\n🃏 *БЛЭКДЖЕК (ОЧКО)*\nочко 100 — пример: очко 100\n\n🎡 *РУЛЕТКА*\nрул кра 100 — на красное\nрул чер 100 — на чёрное\nрул чет 100 — на чётное\nрул неч 100 — на нечётное\nрул 1-18 100 — 1-18\nрул 19-36 100 — 19-36\nрул ряд1 100 — 1 ряд\nрул столб2 100 — 2 столб\nрул 7 100 — на число 7\nрул зеро 100 — на зеро\nрул 0 100 — на зеро\n\n💰 *МИНИМАЛЬНАЯ СТАВКА: $1*`, { parse_mode: 'Markdown' })
}

async function showCasino(ctx) {
  await ctx.reply(`🎰 *КАЗИНО* 🎰\n\n*КОМАНДЫ:*\n\n🃏 *БЛЭКДЖЕК (ОЧКО)*\nочко 100 — сыграть в очко\n\n🎡 *РУЛЕТКА*\nрул кра 100 — на красное\nрул чер 100 — на чёрное\nрул чет 100 — на чётное\nрул неч 100 — на нечётное\nрул 1-18 100 — 1-18\nрул 19-36 100 — 19-36\nрул ряд1 100 — 1 ряд\nрул столб2 100 — 2 столб\nрул 7 100 — на число 7\nрул зеро 100 — на зеро\n\n💰 *МИНИМАЛЬНАЯ СТАВКА: $1*`, { parse_mode: 'Markdown' })
}

async function handleCasino(ctx, gameType) {
  if (gameType === 'cancel' || gameType === 'casino_cancel') {
    await ctx.answerCbQuery()
    await ctx.editMessageText('❌ ИГРА ОТМЕНЕНА.')
    return
  }
  await ctx.answerCbQuery('ИСПОЛЬЗУЙ ТЕКСТОВЫЕ КОМАНДЫ! НАПИШИ /casino')
}

module.exports = { showCasino, handleCasino, handleCasinoCommand }