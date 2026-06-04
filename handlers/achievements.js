// handlers/achievements.js
const { getPlayer, savePlayer, addExp } = require('../utils/db')

// ========== ВСЕ АЧИВКИ (85 ШТУК) ==========
const ACHIEVEMENTS = {
  // ===== КРАФТ (10 ачивок) =====
  craft_first: { id: 'craft_first', name: '🔬 Первый синтез', desc: 'Сварить первый наркотик', category: '🧪 Крафт', reward: 50, target: 1, type: 'craft_count' },
  craft_10: { id: 'craft_10', name: '🔬 Подмастерье', desc: 'Сварить 10 наркотиков', category: '🧪 Крафт', reward: 200, target: 10, type: 'craft_count' },
  craft_50: { id: 'craft_50', name: '🔬 Химик', desc: 'Сварить 50 наркотиков', category: '🧪 Крафт', reward: 500, target: 50, type: 'craft_count' },
  craft_100: { id: 'craft_100', name: '🔬 Профессор', desc: 'Сварить 100 наркотиков', category: '🧪 Крафт', reward: 1000, target: 100, type: 'craft_count' },
  craft_500: { id: 'craft_500', name: '🔬 Гений', desc: 'Сварить 500 наркотиков', category: '🧪 Крафт', reward: 5000, target: 500, type: 'craft_count' },
  craft_1000: { id: 'craft_1000', name: '🔬 Легенда', desc: 'Сварить 1000 наркотиков', category: '🧪 Крафт', reward: 10000, target: 1000, type: 'craft_count' },
  krokodil_10: { id: 'krokodil_10', name: '🐊 Крокодил', desc: 'Сварить 10г Крокодила', category: '🧪 Крафт', reward: 100, target: 10, type: 'drug_krokodil' },
  meth_10: { id: 'meth_10', name: '❄️ Снежный барон', desc: 'Сварить 10г Мета', category: '🧪 Крафт', reward: 150, target: 10, type: 'drug_meth' },
  blue_meth_10: { id: 'blue_meth_10', name: '💎 Вальтер Вайт', desc: 'Сварить 10г Голубого Мета', category: '🧪 Крафт', reward: 300, target: 10, type: 'drug_blue_meth' },
  lsd_5: { id: 'lsd_5', name: '🧪 Хранитель грёз', desc: 'Сварить 5г ЛСД', category: '🧪 Крафт', reward: 500, target: 5, type: 'drug_lsd' },
  
  // ===== ПРОДАЖИ (8 ачивок) =====
  sell_first: { id: 'sell_first', name: '💰 Первая сделка', desc: 'Продать первый товар', category: '💰 Продажи', reward: 50, target: 1, type: 'sell_count' },
  sell_10: { id: 'sell_10', name: '💰 Торгаш', desc: 'Продать 10 раз', category: '💰 Продажи', reward: 200, target: 10, type: 'sell_count' },
  sell_50: { id: 'sell_50', name: '💰 Барыга', desc: 'Продать 50 раз', category: '💰 Продажи', reward: 500, target: 50, type: 'sell_count' },
  sell_100: { id: 'sell_100', name: '💰 Оптовик', desc: 'Продать 100 раз', category: '💰 Продажи', reward: 1000, target: 100, type: 'sell_count' },
  sell_500: { id: 'sell_500', name: '💰 Наркобарон', desc: 'Продать 500 раз', category: '💰 Продажи', reward: 5000, target: 500, type: 'sell_count' },
  money_10k: { id: 'money_10k', name: '💰 Десятник', desc: 'Заработать $10,000', category: '💰 Продажи', reward: 200, target: 10000, type: 'total_money' },
  money_100k: { id: 'money_100k', name: '💰 Сотник', desc: 'Заработать $100,000', category: '💰 Продажи', reward: 1000, target: 100000, type: 'total_money' },
  money_1M: { id: 'money_1M', name: '💰 Миллионер', desc: 'Заработать $1,000,000', category: '💰 Продажи', reward: 10000, target: 1000000, type: 'total_money' },
  
  // ===== УРОВНИ (10 ачивок) =====
  level_2: { id: 'level_2', name: '⭐ 2 уровень', desc: 'Достичь 2 уровня', category: '⭐ Уровни', reward: 50, target: 2, type: 'level' },
  level_5: { id: 'level_5', name: '⭐ 5 уровень', desc: 'Достичь 5 уровня', category: '⭐ Уровни', reward: 200, target: 5, type: 'level' },
  level_10: { id: 'level_10', name: '⭐ 10 уровень', desc: 'Достичь 10 уровня', category: '⭐ Уровни', reward: 500, target: 10, type: 'level' },
  level_15: { id: 'level_15', name: '⭐ 15 уровень', desc: 'Достичь 15 уровня', category: '⭐ Уровни', reward: 800, target: 15, type: 'level' },
  level_20: { id: 'level_20', name: '⭐ 20 уровень', desc: 'Достичь 20 уровня', category: '⭐ Уровни', reward: 1200, target: 20, type: 'level' },
  level_30: { id: 'level_30', name: '⭐ 30 уровень', desc: 'Достичь 30 уровня', category: '⭐ Уровни', reward: 2000, target: 30, type: 'level' },
  level_40: { id: 'level_40', name: '⭐ 40 уровень', desc: 'Достичь 40 уровня', category: '⭐ Уровни', reward: 3500, target: 40, type: 'level' },
  level_50: { id: 'level_50', name: '⭐ 50 уровень', desc: 'Достичь 50 уровня', category: '⭐ Уровни', reward: 5000, target: 50, type: 'level' },
  level_75: { id: 'level_75', name: '⭐ 75 уровень', desc: 'Достичь 75 уровня', category: '⭐ Уровни', reward: 10000, target: 75, type: 'level' },
  level_100: { id: 'level_100', name: '⭐ 100 уровень', desc: 'Достичь 100 уровня', category: '⭐ Уровни', reward: 25000, target: 100, type: 'level' },
  
  // ===== МАШИНЫ (8 ачивок) =====
  car_first: { id: 'car_first', name: '🚗 Первая тачка', desc: 'Купить первую машину', category: '🚗 Машины', reward: 100, target: 1, type: 'cars_count' },
  car_3: { id: 'car_3', name: '🚗 Автолюбитель', desc: 'Купить 3 машины', category: '🚗 Машины', reward: 300, target: 3, type: 'cars_count' },
  car_5: { id: 'car_5', name: '🚗 Коллекционер', desc: 'Купить 5 машин', category: '🚗 Машины', reward: 500, target: 5, type: 'cars_count' },
  car_10: { id: 'car_10', name: '🚗 Автомагнат', desc: 'Купить 10 машин', category: '🚗 Машины', reward: 1000, target: 10, type: 'cars_count' },
  tuning_first: { id: 'tuning_first', name: '⚡ Первый тюнинг', desc: 'Улучшить машину 1 раз', category: '🚗 Машины', reward: 100, target: 1, type: 'tuning_count' },
  tuning_10: { id: 'tuning_10', name: '⚡ Гонщик', desc: 'Улучшить машину 10 раз', category: '🚗 Машины', reward: 500, target: 10, type: 'tuning_count' },
  tuning_25: { id: 'tuning_25', name: '⚡ Тюнинг-мастер', desc: 'Улучшить машину 25 раз', category: '🚗 Машины', reward: 1500, target: 25, type: 'tuning_count' },
  secret_car: { id: 'secret_car', name: '🛸 Секретная', desc: 'Купить секретную машину', category: '🚗 Машины', reward: 5000, target: 1, type: 'car_secret' },
  
  // ===== ОБОРУДОВАНИЕ (7 ачивок) =====
  equip_first: { id: 'equip_first', name: '🔧 Первый инструмент', desc: 'Купить оборудование', category: '🔧 Оборудование', reward: 50, target: 1, type: 'equip_count' },
  equip_10: { id: 'equip_10', name: '🔧 Оснащение', desc: 'Купить 10 единиц оборудования', category: '🔧 Оборудование', reward: 300, target: 10, type: 'equip_count' },
  equip_25: { id: 'equip_25', name: '🔧 Лаборатория', desc: 'Купить 25 единиц оборудования', category: '🔧 Оборудование', reward: 800, target: 25, type: 'equip_count' },
  equip_50: { id: 'equip_50', name: '🔧 Профессионал', desc: 'Купить 50 единиц оборудования', category: '🔧 Оборудование', reward: 2000, target: 50, type: 'equip_count' },
  fusion_first: { id: 'fusion_first', name: '🔮 Первое скрещивание', desc: 'Скрестить оборудование', category: '🔧 Оборудование', reward: 100, target: 1, type: 'fusion_count' },
  fusion_10: { id: 'fusion_10', name: '🔮 Алхимик', desc: 'Скрестить 10 раз', category: '🔧 Оборудование', reward: 500, target: 10, type: 'fusion_count' },
  fusion_success: { id: 'fusion_success', name: '🔮 Успех!', desc: 'Успешное скрещивание', category: '🔧 Оборудование', reward: 300, target: 1, type: 'fusion_success' },
  
  // ===== БОКСЫ И ГЛИФЫ (7 ачивок) =====
  box_first: { id: 'box_first', name: '📦 Первый бокс', desc: 'Открыть бокс', category: '📦 Боксы', reward: 50, target: 1, type: 'box_count' },
  box_10: { id: 'box_10', name: '📦 Везунчик', desc: 'Открыть 10 боксов', category: '📦 Боксы', reward: 300, target: 10, type: 'box_count' },
  box_50: { id: 'box_50', name: '📦 Счастливчик', desc: 'Открыть 50 боксов', category: '📦 Боксы', reward: 1000, target: 50, type: 'box_count' },
  box_100: { id: 'box_100', name: '📦 Азартный', desc: 'Открыть 100 боксов', category: '📦 Боксы', reward: 2500, target: 100, type: 'box_count' },
  glyph_common: { id: 'glyph_common', name: '🟢 Обычный глиф', desc: 'Получить обычный глиф', category: '📦 Боксы', reward: 50, target: 1, type: 'glyph_common' },
  glyph_epic: { id: 'glyph_epic', name: '🟣 Эпический глиф', desc: 'Получить эпический глиф', category: '📦 Боксы', reward: 300, target: 1, type: 'glyph_epic' },
  glyph_legendary: { id: 'glyph_legendary', name: '🟠 Легендарный глиф', desc: 'Получить легендарный глиф', category: '📦 Боксы', reward: 1000, target: 1, type: 'glyph_legendary' },
  
  // ===== БИЗНЕС (5 ачивок) =====
  business_first: { id: 'business_first', name: '🏢 Предприниматель', desc: 'Купить бизнес', category: '🏢 Бизнес', reward: 500, target: 1, type: 'business_count' },
  business_profit_10k: { id: 'business_profit_10k', name: '🏢 Прибыль', desc: 'Отмыть $10,000', category: '🏢 Бизнес', reward: 500, target: 10000, type: 'business_profit' },
  business_profit_100k: { id: 'business_profit_100k', name: '🏢 Магнат', desc: 'Отмыть $100,000', category: '🏢 Бизнес', reward: 2000, target: 100000, type: 'business_profit' },
  business_profit_1M: { id: 'business_profit_1M', name: '🏢 Олигарх', desc: 'Отмыть $1,000,000', category: '🏢 Бизнес', reward: 10000, target: 1000000, type: 'business_profit' },
  bank_business: { id: 'bank_business', name: '🏦 Банкир', desc: 'Купить банк', category: '🏢 Бизнес', reward: 5000, target: 1, type: 'business_bank' },
  
  // ===== КАЗИНО (6 ачивок) =====
  casino_first: { id: 'casino_first', name: '🎰 Первая ставка', desc: 'Сделать ставку', category: '🎰 Казино', reward: 50, target: 1, type: 'casino_bet' },
  casino_10: { id: 'casino_10', name: '🎰 Игрок', desc: 'Сделать 10 ставок', category: '🎰 Казино', reward: 200, target: 10, type: 'casino_bet' },
  casino_50: { id: 'casino_50', name: '🎰 Азартный', desc: 'Сделать 50 ставок', category: '🎰 Казино', reward: 800, target: 50, type: 'casino_bet' },
  casino_win_first: { id: 'casino_win_first', name: '🎰 Первый выигрыш', desc: 'Выиграть в казино', category: '🎰 Казино', reward: 100, target: 1, type: 'casino_wins' },
  casino_win_10: { id: 'casino_win_10', name: '🎰 Везунчик', desc: 'Выиграть 10 раз', category: '🎰 Казино', reward: 500, target: 10, type: 'casino_wins' },
  casino_jackpot: { id: 'casino_jackpot', name: '🎰 ДЖЕКПОТ!', desc: 'Сорвать джекпот', category: '🎰 Казино', reward: 5000, target: 1, type: 'casino_jackpot' },
  
  // ===== ПОЛИЦИЯ (6 ачивок) =====
  wanted_100: { id: 'wanted_100', name: '👮 В розыске', desc: 'Достичь 100% розыска', category: '👮 Полиция', reward: 200, target: 100, type: 'wanted_max' },
  bribe_first: { id: 'bribe_first', name: '👮 Взятка', desc: 'Дать взятку', category: '👮 Полиция', reward: 100, target: 1, type: 'bribe_count' },
  bribe_10: { id: 'bribe_10', name: '👮 Коррупционер', desc: 'Дать 10 взяток', category: '👮 Полиция', reward: 1000, target: 10, type: 'bribe_count' },
  raid_first: { id: 'raid_first', name: '👮 Рейд', desc: 'Пережить рейд', category: '👮 Полиция', reward: 200, target: 1, type: 'raid_count' },
  raid_5: { id: 'raid_5', name: '👮 Неуловимый', desc: 'Пережить 5 рейдов', category: '👮 Полиция', reward: 1000, target: 5, type: 'raid_count' },
  survive_raid: { id: 'survive_raid', name: '👮 Выживший', desc: 'Выжить после рейда без потерь', category: '👮 Полиция', reward: 500, target: 1, type: 'raid_survive' },
  
  // ===== РЕФЕРАЛЫ (5 ачивок) =====
  referral_1: { id: 'referral_1', name: '👥 Пригласил первого друга', desc: 'Пригласить 1 друга', category: '👥 Рефералы', reward: 500, target: 1, type: 'referrals_count' },
  referral_3: { id: 'referral_3', name: '👥 Команда', desc: 'Пригласить 3 друзей', category: '👥 Рефералы', reward: 1500, target: 3, type: 'referrals_count' },
  referral_5: { id: 'referral_5', name: '👥 Лидер', desc: 'Пригласить 5 друзей', category: '👥 Рефералы', reward: 3000, target: 5, type: 'referrals_count' },
  referral_10: { id: 'referral_10', name: '👥 Мафия', desc: 'Пригласить 10 друзей', category: '👥 Рефералы', reward: 10000, target: 10, type: 'referrals_count' },
  referral_25: { id: 'referral_25', name: '👥 Империя', desc: 'Пригласить 25 друзей', category: '👥 Рефералы', reward: 50000, target: 25, type: 'referrals_count' },
  
  // ===== ЕЖЕДНЕВНЫЕ (4 ачивки) =====
  daily_3: { id: 'daily_3', name: '🎁 3 дня подряд', desc: 'Получить бонус 3 дня подряд', category: '🎁 Ежедневные', reward: 300, target: 3, type: 'daily_streak' },
  daily_7: { id: 'daily_7', name: '🎁 Неделя', desc: 'Получить бонус 7 дней подряд', category: '🎁 Ежедневные', reward: 1000, target: 7, type: 'daily_streak' },
  daily_30: { id: 'daily_30', name: '🎁 Месяц', desc: 'Получить бонус 30 дней подряд', category: '🎁 Ежедневные', reward: 5000, target: 30, type: 'daily_streak' },
  quest_10: { id: 'quest_10', name: '📋 Квестер', desc: 'Выполнить 10 квестов', category: '🎁 Ежедневные', reward: 1000, target: 10, type: 'quests_complete' },
  
  // ===== ГИЛЬДИЯ (4 ачивки) =====
  guild_create: { id: 'guild_create', name: '🏆 Лидер', desc: 'Создать гильдию', category: '🏆 Гильдия', reward: 5000, target: 1, type: 'guild_create' },
  guild_join: { id: 'guild_join', name: '🏆 Участник', desc: 'Вступить в гильдию', category: '🏆 Гильдия', reward: 500, target: 1, type: 'guild_join' },
  guild_members_5: { id: 'guild_members_5', name: '🏆 Популярный', desc: '5 участников в гильдии', category: '🏆 Гильдия', reward: 2000, target: 5, type: 'guild_members' },
  guild_members_10: { id: 'guild_members_10', name: '🏆 Клановый', desc: '10 участников в гильдии', category: '🏆 Гильдия', reward: 10000, target: 10, type: 'guild_members' },
  
  // ===== ГЛИФЫ (5 ачивок) =====
  glyph_5: { id: 'glyph_5', name: '✨ 5 глифов', desc: 'Собрать 5 глифов', category: '✨ Глифы', reward: 200, target: 5, type: 'glyphs_total' },
  glyph_10: { id: 'glyph_10', name: '✨ 10 глифов', desc: 'Собрать 10 глифов', category: '✨ Глифы', reward: 500, target: 10, type: 'glyphs_total' },
  glyph_25: { id: 'glyph_25', name: '✨ Коллекционер', desc: 'Собрать 25 глифов', category: '✨ Глифы', reward: 2000, target: 25, type: 'glyphs_total' },
  glyph_mythic: { id: 'glyph_mythic', name: '🔴 Мифический', desc: 'Получить мифический глиф', category: '✨ Глифы', reward: 5000, target: 1, type: 'glyph_mythic' },
  glyph_all: { id: 'glyph_all', name: '🏆 Мастер глифов', desc: 'Собрать все типы глифов', category: '✨ Глифы', reward: 10000, target: 5, type: 'glyph_types' }
}

// Категории для отображения
const CATEGORIES = [
  { id: '🧪 Крафт', icon: '🧪', name: 'Крафт' },
  { id: '💰 Продажи', icon: '💰', name: 'Продажи' },
  { id: '⭐ Уровни', icon: '⭐', name: 'Уровни' },
  { id: '🚗 Машины', icon: '🚗', name: 'Машины' },
  { id: '🔧 Оборудование', icon: '🔧', name: 'Оборудование' },
  { id: '📦 Боксы', icon: '📦', name: 'Боксы' },
  { id: '🏢 Бизнес', icon: '🏢', name: 'Бизнес' },
  { id: '🎰 Казино', icon: '🎰', name: 'Казино' },
  { id: '👮 Полиция', icon: '👮', name: 'Полиция' },
  { id: '👥 Рефералы', icon: '👥', name: 'Рефералы' },
  { id: '🎁 Ежедневные', icon: '🎁', name: 'Ежедневные' },
  { id: '🏆 Гильдия', icon: '🏆', name: 'Гильдия' },
  { id: '✨ Глифы', icon: '✨', name: 'Глифы' }
]

function getAchievementsByCategory(categoryId) {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === categoryId)
}

// ========== ПРОВЕРКА АЧИВОК ==========
async function checkAchievements(userId, type, value = 1) {
  const player = getPlayer(userId)
  let stats = player.achievementStats || {}
  let completed = player.achievements || []
  let newAchievements = []
  
  if (!stats[type]) stats[type] = 0
  stats[type] += value
  
  for (const ach of Object.values(ACHIEVEMENTS)) {
    if (completed.includes(ach.id)) continue
    
    let current = 0
    switch (ach.type) {
      case 'craft_count': current = stats.craft_count || 0; break
      case 'sell_count': current = stats.sell_count || 0; break
      case 'total_money': current = stats.total_money || 0; break
      case 'level': current = player.level || 0; break
      case 'cars_count': current = stats.cars_count || 0; break
      case 'tuning_count': current = stats.tuning_count || 0; break
      case 'car_secret': current = stats.car_secret || 0; break
      case 'equip_count': current = stats.equip_count || 0; break
      case 'fusion_count': current = stats.fusion_count || 0; break
      case 'fusion_success': current = stats.fusion_success || 0; break
      case 'box_count': current = stats.box_count || 0; break
      case 'glyph_common': current = stats.glyph_common || 0; break
      case 'glyph_epic': current = stats.glyph_epic || 0; break
      case 'glyph_legendary': current = stats.glyph_legendary || 0; break
      case 'glyph_mythic': current = stats.glyph_mythic || 0; break
      case 'glyphs_total': current = stats.glyphs_total || 0; break
      case 'glyph_types': current = stats.glyph_types || 0; break
      case 'business_count': current = stats.business_count || 0; break
      case 'business_profit': current = stats.business_profit || 0; break
      case 'business_bank': current = stats.business_bank || 0; break
      case 'casino_bet': current = stats.casino_bet || 0; break
      case 'casino_wins': current = stats.casino_wins || 0; break
      case 'casino_jackpot': current = stats.casino_jackpot || 0; break
      case 'wanted_max': current = stats.wanted_max || 0; break
      case 'bribe_count': current = stats.bribe_count || 0; break
      case 'raid_count': current = stats.raid_count || 0; break
      case 'raid_survive': current = stats.raid_survive || 0; break
      case 'referrals_count': current = stats.referrals_count || 0; break
      case 'daily_streak': current = stats.daily_streak || 0; break
      case 'quests_complete': current = stats.quests_complete || 0; break
      case 'guild_create': current = stats.guild_create || 0; break
      case 'guild_join': current = stats.guild_join || 0; break
      case 'guild_members': current = stats.guild_members || 0; break
      case 'drug_krokodil': current = stats.drug_krokodil || 0; break
      case 'drug_meth': current = stats.drug_meth || 0; break
      case 'drug_blue_meth': current = stats.drug_blue_meth || 0; break
      case 'drug_lsd': current = stats.drug_lsd || 0; break
      default: continue
    }
    
    if (current >= ach.target) {
      completed.push(ach.id)
      newAchievements.push(ach)
      addExp(userId, ach.reward)
    }
  }
  
  if (newAchievements.length > 0) {
    savePlayer(userId, { achievements: completed, achievementStats: stats })
  }
  
  return newAchievements
}

// ========== ПОКАЗАТЬ КАТЕГОРИИ (ГЛАВНОЕ МЕНЮ) ==========
async function showAchievements(ctx) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const completed = player.achievements || []
  
  let totalCompleted = 0
  let totalAchievements = Object.keys(ACHIEVEMENTS).length
  
  for (const ach of Object.values(ACHIEVEMENTS)) {
    if (completed.includes(ach.id)) totalCompleted++
  }
  
  const progress = Math.round((totalCompleted / totalAchievements) * 100)
  const barLength = 15
  const filled = Math.round(barLength * progress / 100)
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
  
  let message = `🏆 *ДОСТИЖЕНИЯ*\n`
  message += `${bar} ${progress}% (${totalCompleted}/${totalAchievements})\n\n`
  message += `*Выбери категорию:*\n`
  
  const buttons = []
  let row = []
  
  for (const cat of CATEGORIES) {
    const achievements = getAchievementsByCategory(cat.id)
    let catCompleted = 0
    for (const ach of achievements) {
      if (completed.includes(ach.id)) catCompleted++
    }
    const catProgress = achievements.length > 0 ? Math.round((catCompleted / achievements.length) * 100) : 0
    
    row.push({ text: `${cat.icon} ${cat.name} ${catProgress}%`, callback_data: `cat_${cat.id}` })
    if (row.length === 2) {
      buttons.push([...row])
      row = []
    }
  }
  if (row.length > 0) buttons.push([...row])
  
  buttons.push([{ text: '❌ Закрыть', callback_data: 'ach_close' }])
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } })
  } else {
    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } })
  }
}

// ========== ПОКАЗАТЬ ВСЕ АЧИВКИ КАТЕГОРИИ ==========
async function showCategoryAchievements(ctx, categoryId) {
  const userId = ctx.from.id.toString()
  const player = getPlayer(userId)
  const completed = player.achievements || []
  const achievements = getAchievementsByCategory(categoryId)
  
  let message = `🏆 *${categoryId}*\n\n`
  const buttons = []
  
  // Сортируем: сначала неполученные, потом полученные
  const sorted = [...achievements].sort((a, b) => {
    const aComp = completed.includes(a.id)
    const bComp = completed.includes(b.id)
    if (aComp === bComp) return 0
    return aComp ? 1 : -1
  })
  
  for (const ach of sorted) {
    const isCompleted = completed.includes(ach.id)
    const icon = isCompleted ? '✅' : '🔒'
    message += `${icon} *${ach.name}* — ${ach.desc}\n`
    message += `   🎁 Награда: +${ach.reward} EXP\n`
    if (!isCompleted) {
      message += `   ⚠️ НЕ ПОЛУЧЕНО\n`
    }
    message += `\n`
  }
  
  buttons.push([{ text: '🔙 Назад', callback_data: 'ach_back' }])
  
  await ctx.editMessageText(message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } })
}

async function achievementHandler(ctx, data) {
  console.log('achievementHandler вызван с data:', data)
  
  if (data === 'ach_close') {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    return
  }
  
  if (data === 'ach_back') {
    await showAchievements(ctx)
    return
  }
  
  if (data.startsWith('cat_')) {
    const categoryId = data.replace('cat_', '')
    await showCategoryAchievements(ctx, categoryId)
    return
  }
}

module.exports = { showAchievements, achievementHandler, checkAchievements, ACHIEVEMENTS }