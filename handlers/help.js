// handlers/help.js
async function showHelp(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Основные', callback_data: 'help_main' }, { text: '💰 Экономика', callback_data: 'help_economy' }],
        [{ text: '🚗 Транспорт', callback_data: 'help_cars' }, { text: '🔧 Оборудование', callback_data: 'help_equipment' }],
        [{ text: '👥 Социальное', callback_data: 'help_social' }, { text: '🏆 Прогресс', callback_data: 'help_progress' }],
        [{ text: '❌ Закрыть', callback_data: 'help_close' }]
      ]
    }
  }

  await ctx.reply(
    `📋 *Выбери категорию команд:*`,
    { parse_mode: 'Markdown', ...keyboard }
  )
}

const COMMANDS = {
  main: `📋 <b>ОСНОВНЫЕ КОМАНДЫ</b>\n\n/start — запустить бота\n/help — это сообщение\n/profile — посмотреть профиль\n/inventory — инвентарь\n\n🖥️ <i>Mini App:</i> кнопка меню внизу экрана!`,
  economy: `💰 <b>ЭКОНОМИКА</b>\n\n/shop или магазин — купить ингредиенты\n/craft или варка — сварить наркотик\n/sell или продажа — продать товар\n/business — купить бизнес\n/top или лидеры — топ игроков`,
  cars: `🚗 <b>ТРАНСПОРТ</b>\n\n/cars или машины — купить транспорт\n/tuning — улучшить машину\n/repair — починить машину`,
  equipment: `🔧 <b>ОБОРУДОВАНИЕ</b>\n\n/equipment — купить оборудование\n/fusion или скрестить — скрестить 2 предмета\n/boxes или боксы — открыть боксы\n/shardshop или шардшоп — магазин осколков`,
  social: `👥 <b>СОЦИАЛЬНОЕ</b>\n\n/referrals или рефералы — пригласить друзей\n/guild или гильдия — создать/вступить\n\n🎰 <b>РАЗВЛЕЧЕНИЯ</b>\n/casino или казино — сыграть\n\n🎁 <b>БОНУСЫ</b>\n/daily или ежедневный — бонус каждый день\n/quests или квесты — ежедневные задания`,
  progress: `🏆 <b>ПРОГРЕСС И КРИМИНАЛ</b>\n\n/achievements или ачивки — достижения\n/wanted или розыск — уровень розыска\n/bribe или взятка — дать взятку\n/raid или рейд — ограбление`
}

// Обработчик кнопок помощи (экспортируем отдельно)
async function handleHelpButtons(ctx, action) {
  const category = action.replace('help_', '')
  
  if (category === 'close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  let text = ''
  switch(category) {
    case 'main': text = COMMANDS.main; break
    case 'economy': text = COMMANDS.economy; break
    case 'cars': text = COMMANDS.cars; break
    case 'equipment': text = COMMANDS.equipment; break
    case 'social': text = COMMANDS.social; break
    case 'progress': text = COMMANDS.progress; break
    default: text = 'Неизвестная категория'
  }
  
  // Кнопки: Назад и Закрыть
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'help_back' }, { text: '❌ Закрыть', callback_data: 'help_close' }]
      ]
    }
  }
  
  await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard })
}

async function handleHelpBack(ctx) {
  // Возвращаем главное меню помощи
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Основные', callback_data: 'help_main' }, { text: '💰 Экономика', callback_data: 'help_economy' }],
        [{ text: '🚗 Транспорт', callback_data: 'help_cars' }, { text: '🔧 Оборудование', callback_data: 'help_equipment' }],
        [{ text: '👥 Социальное', callback_data: 'help_social' }, { text: '🏆 Прогресс', callback_data: 'help_progress' }],
        [{ text: '❌ Закрыть', callback_data: 'help_close' }]
      ]
    }
  }
  
  await ctx.editMessageText(
    `📋 *Выбери категорию команд:*`,
    { parse_mode: 'Markdown', ...keyboard }
  )
}

module.exports = { showHelp, COMMANDS, handleHelpButtons, handleHelpBack }