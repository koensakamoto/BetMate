import { StoreItemData } from './StoreItem';
import { StoreCategory } from './StoreCategoryTabs';

// Backend entity enums
export enum ItemType {
  ROAST_CARD_PACK = 'ROAST_CARD_PACK',
  TAUNT_COLLECTION = 'TAUNT_COLLECTION',
  TITLE = 'TITLE',
  BADGE = 'BADGE',
  AVATAR_SKIN = 'AVATAR_SKIN',
  PROFILE_THEME = 'PROFILE_THEME',
  PROFILE_FRAME = 'PROFILE_FRAME',
  EMOJI_PACK = 'EMOJI_PACK',
  CHAT_EFFECT = 'CHAT_EFFECT'
}

export enum ItemCategory {
  SOCIAL = 'SOCIAL',
  PROGRESSION = 'PROGRESSION',
  CUSTOMIZATION = 'CUSTOMIZATION'
}

export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export const storeItems: Record<StoreCategory, StoreItemData[]> = {
  'featured': [
    {
      id: 'legendary-roast-pack',
      name: 'Legendary Roast Pack',
      description: 'The ultimate collection of devastating roasts',
      price: 500,
      emoji: '🔥',
      itemType: ItemType.ROAST_CARD_PACK,
      category: ItemCategory.SOCIAL,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      isFeatured: true,
      isLimitedTime: true,
      availableUntil: '2025-01-15T23:59:59',
      sortOrder: 1
    },
    {
      id: 'king-of-bets',
      name: 'King of Bets',
      description: 'Ultimate title for betting legends',
      price: 300,
      emoji: '👑',
      itemType: ItemType.TITLE,
      category: ItemCategory.PROGRESSION,
      rarity: Rarity.EPIC,
      isOwned: false,
      isFeatured: true,
      sortOrder: 2
    },
    {
      id: 'diamond-avatar',
      name: 'Diamond Avatar Skin',
      description: 'Exclusive crystalline avatar design',
      price: 250,
      emoji: '💎',
      itemType: ItemType.AVATAR_SKIN,
      category: ItemCategory.CUSTOMIZATION,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      isFeatured: true,
      sortOrder: 3
    }
  ],

  'social': [
    {
      id: 'savage-roast-pack',
      name: 'Savage Roast Pack',
      description: 'Brutally funny roasts to use on opponents',
      price: 150,
      emoji: '🔥',
      itemType: ItemType.ROAST_CARD_PACK,
      category: ItemCategory.SOCIAL,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'trash-talk-collection',
      name: 'Trash Talk Collection',
      description: 'Professional-grade taunts and comebacks',
      price: 100,
      emoji: '🗣️',
      itemType: ItemType.TAUNT_COLLECTION,
      category: ItemCategory.SOCIAL,
      rarity: Rarity.UNCOMMON,
      isOwned: true,
      sortOrder: 2
    },
    {
      id: 'winner-emojis',
      name: 'Winner Emoji Pack',
      description: 'Exclusive victory celebration emojis',
      price: 75,
      emoji: '🏆',
      itemType: ItemType.EMOJI_PACK,
      category: ItemCategory.SOCIAL,
      rarity: Rarity.COMMON,
      isOwned: false,
      sortOrder: 3
    },
    {
      id: 'lightning-chat-effects',
      name: 'Lightning Chat Effects',
      description: 'Electrifying message animations',
      price: 125,
      emoji: '⚡',
      itemType: ItemType.CHAT_EFFECT,
      category: ItemCategory.SOCIAL,
      rarity: Rarity.RARE,
      isOwned: false,
      isLimitedTime: true,
      availableUntil: '2025-02-01T23:59:59',
      sortOrder: 4
    }
  ],

  'progression': [
    {
      id: 'bet-master',
      name: 'Bet Master',
      description: 'Show your expertise with this prestigious title',
      price: 200,
      emoji: '🎯',
      itemType: ItemType.TITLE,
      category: ItemCategory.PROGRESSION,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'lucky-streak',
      name: 'Lucky Streak',
      description: 'For those blessed by fortune',
      price: 150,
      emoji: '🍀',
      itemType: ItemType.TITLE,
      category: ItemCategory.PROGRESSION,
      rarity: Rarity.RARE,
      isOwned: true,
      sortOrder: 2
    },
    {
      id: 'high-roller-badge',
      name: 'High Roller Badge',
      description: 'Badge for serious bettors',
      price: 250,
      emoji: '🎲',
      itemType: ItemType.BADGE,
      category: ItemCategory.PROGRESSION,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 3
    },
    {
      id: 'winning-streak-badge',
      name: 'Winning Streak Badge',
      description: 'Achievement badge for consecutive wins',
      price: 100,
      emoji: '🔥',
      itemType: ItemType.BADGE,
      category: ItemCategory.PROGRESSION,
      rarity: Rarity.UNCOMMON,
      isOwned: false,
      sortOrder: 4
    }
  ],

  'customization': [
    {
      id: 'neon-avatar',
      name: 'Neon Avatar Skin',
      description: 'Vibrant glowing avatar design',
      price: 125,
      emoji: '🌈',
      itemType: ItemType.AVATAR_SKIN,
      category: ItemCategory.CUSTOMIZATION,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'gold-profile-frame',
      name: 'Gold Profile Frame',
      description: 'Luxurious golden border for your profile',
      price: 100,
      emoji: '👑',
      itemType: ItemType.PROFILE_FRAME,
      category: ItemCategory.CUSTOMIZATION,
      rarity: Rarity.UNCOMMON,
      isOwned: false,
      sortOrder: 2
    },
    {
      id: 'dark-mode-theme',
      name: 'Midnight Theme',
      description: 'Sleek dark purple color scheme',
      price: 75,
      emoji: '🌙',
      itemType: ItemType.PROFILE_THEME,
      category: ItemCategory.CUSTOMIZATION,
      rarity: Rarity.COMMON,
      isOwned: true,
      sortOrder: 3
    },
    {
      id: 'ocean-theme',
      name: 'Ocean Wave Theme',
      description: 'Calming blue gradient theme',
      price: 50,
      emoji: '🌊',
      itemType: ItemType.PROFILE_THEME,
      category: ItemCategory.CUSTOMIZATION,
      rarity: Rarity.COMMON,
      isOwned: false,
      sortOrder: 4
    },
    {
      id: 'victory-frame',
      name: 'Victory Frame',
      description: 'Animated trophy border for winners',
      price: 200,
      emoji: '🏆',
      itemType: ItemType.PROFILE_FRAME,
      category: ItemCategory.CUSTOMIZATION,
      rarity: Rarity.EPIC,
      isOwned: false,
      isLimitedTime: true,
      availableUntil: '2025-01-30T23:59:59',
      sortOrder: 5
    }
  ]
};

export interface EarnCreditsOption {
  id: string;
  title: string;
  description: string;
  credits: number;
  emoji: string;
  type: 'daily' | 'action' | 'social' | 'challenge';
  isCompleted?: boolean;
  isAvailable?: boolean;
}

export const earnCreditsOptions: EarnCreditsOption[] = [
  {
    id: 'daily-login',
    title: 'Daily Login',
    description: 'Log in every day to earn credits',
    credits: 10,
    emoji: '📅',
    type: 'daily',
    isCompleted: true,
    isAvailable: false
  },
  {
    id: 'win-bet',
    title: 'Win a Bet',
    description: 'Earn credits for each successful prediction',
    credits: 25,
    emoji: '🎯',
    type: 'action',
    isCompleted: false,
    isAvailable: true
  },
  {
    id: 'invite-friends',
    title: 'Invite Friends',
    description: 'Get credits for each friend who joins',
    credits: 100,
    emoji: '👥',
    type: 'social',
    isCompleted: false,
    isAvailable: true
  },
  {
    id: 'weekly-challenge',
    title: 'Weekly Challenge',
    description: 'Complete weekly betting challenges',
    credits: 150,
    emoji: '🏅',
    type: 'challenge',
    isCompleted: false,
    isAvailable: true
  },
  {
    id: 'rate-app',
    title: 'Rate the App',
    description: 'Leave a review on the app store',
    credits: 50,
    emoji: '⭐',
    type: 'action',
    isCompleted: false,
    isAvailable: true
  },
  {
    id: 'streak-bonus',
    title: '7-Day Streak Bonus',
    description: 'Login for 7 consecutive days',
    credits: 200,
    emoji: '🔥',
    type: 'challenge',
    isCompleted: false,
    isAvailable: true
  }
];