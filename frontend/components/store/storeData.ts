import { StoreItemData } from './StoreItem';
import { StoreCategory } from './StoreCategoryTabs';

// Backend entity enums
export enum ItemType {
  // Risk Management
  BET_INSURANCE = 'BET_INSURANCE',
  FREEZE_CARD = 'FREEZE_CARD',
  HEDGE_HELPER = 'HEDGE_HELPER',
  MULLIGAN_TOKEN = 'MULLIGAN_TOKEN',

  // Multipliers
  MULTIPLIER = 'MULTIPLIER',
  CREDIT_BOOSTER = 'CREDIT_BOOSTER',

  // Betting Tools
  TIME_EXTENSION = 'TIME_EXTENSION',
  SURE_SHOT = 'SURE_SHOT',
  SIDE_BET_CREATOR = 'SIDE_BET_CREATOR',

  // Discounts
  DISCOUNT_TICKET = 'DISCOUNT_TICKET',
  VIP_PASS = 'VIP_PASS',

  // Boosters
  DAILY_BOOSTER = 'DAILY_BOOSTER',
  CHALLENGE_BOOSTER = 'CHALLENGE_BOOSTER',
  REFERRAL_BOOSTER = 'REFERRAL_BOOSTER'
}

export enum ItemCategory {
  RISK_MANAGEMENT = 'RISK_MANAGEMENT',
  MULTIPLIERS = 'MULTIPLIERS',
  BETTING_TOOLS = 'BETTING_TOOLS',
  DISCOUNTS = 'DISCOUNTS',
  BOOSTERS = 'BOOSTERS'
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
      id: 'diamond-hands',
      name: 'Diamond Hands',
      description: '1.5x payout on ALL bets for 24 hours. Stacks with other bonuses. Active immediately.',
      price: 400,
      emoji: '💎',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      isFeatured: true,
      sortOrder: 1
    },
    {
      id: 'sure-shot',
      name: 'Sure Shot',
      description: 'Place a bet with ZERO risk. Win = full payout, Lose = stake refunded. One-time use.',
      price: 400,
      emoji: '🎯',
      itemType: ItemType.SURE_SHOT,
      category: ItemCategory.BETTING_TOOLS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      isFeatured: true,
      sortOrder: 2
    },
    {
      id: 'triple-threat',
      name: 'Triple Threat',
      description: '3x payout on your next winning bet. Cannot stack with other multipliers. One-time use.',
      price: 600,
      emoji: '3️⃣',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      isFeatured: true,
      sortOrder: 3
    },
    {
      id: 'vip-pass-30',
      name: 'VIP Pass (30 Days)',
      description: '10% discount on all bet stakes for 30 days. Full payouts on wins. Stackable with other discounts.',
      price: 1000,
      emoji: '💳',
      itemType: ItemType.VIP_PASS,
      category: ItemCategory.DISCOUNTS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      isFeatured: true,
      isLimitedTime: true,
      availableUntil: '2025-02-15T23:59:59',
      sortOrder: 4
    }
  ],

  'risk': [
    {
      id: 'bet-insurance-basic',
      name: 'Bet Insurance (Basic)',
      description: 'Get 25% of stake back if you lose. One-time use. Must activate before bet closes.',
      price: 100,
      emoji: '🛡️',
      itemType: ItemType.BET_INSURANCE,
      category: ItemCategory.RISK_MANAGEMENT,
      rarity: Rarity.UNCOMMON,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'bet-insurance-premium',
      name: 'Bet Insurance (Premium)',
      description: 'Get 50% of stake back if you lose. One-time use. Must activate before bet closes.',
      price: 200,
      emoji: '🛡️',
      itemType: ItemType.BET_INSURANCE,
      category: ItemCategory.RISK_MANAGEMENT,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 2
    },
    {
      id: 'freeze-card',
      name: 'Freeze Card',
      description: 'Pause a bet and withdraw your stake. Must use within 1 hour of placing bet. Forfeit 10% fee.',
      price: 175,
      emoji: '⏸️',
      itemType: ItemType.FREEZE_CARD,
      category: ItemCategory.RISK_MANAGEMENT,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 3
    },
    {
      id: 'hedge-helper',
      name: 'Hedge Helper',
      description: 'Place a counter-bet at 50% off stake. Guarantee some return regardless of outcome. One-time use.',
      price: 200,
      emoji: '🔐',
      itemType: ItemType.HEDGE_HELPER,
      category: ItemCategory.RISK_MANAGEMENT,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 4
    },
    {
      id: 'mulligan-token',
      name: 'Mulligan Token',
      description: 'Change your bet choice AFTER deadline. Must use before bet is resolved. One-time use.',
      price: 300,
      emoji: '🔄',
      itemType: ItemType.MULLIGAN_TOKEN,
      category: ItemCategory.RISK_MANAGEMENT,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 5
    },
    {
      id: 'bet-insurance-elite',
      name: 'Bet Insurance (Elite)',
      description: 'Get 75% of stake back if you lose. One-time use. Must activate before bet closes.',
      price: 350,
      emoji: '🛡️',
      itemType: ItemType.BET_INSURANCE,
      category: ItemCategory.RISK_MANAGEMENT,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 6
    }
  ],

  'multipliers': [
    {
      id: 'credit-booster',
      name: 'Credit Booster',
      description: 'Earn 25% more credits from all sources. Includes bet winnings, daily rewards, challenges. Active for 48 hours.',
      price: 150,
      emoji: '💸',
      itemType: ItemType.CREDIT_BOOSTER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'hot-streak-amplifier',
      name: 'Hot Streak Amplifier',
      description: 'Increases multiplier for each consecutive win. Win 2: 1.2x, Win 3: 1.5x, Win 4+: 2x. Lasts 7 days or until you lose.',
      price: 250,
      emoji: '🔥',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 2
    },
    {
      id: 'double-down',
      name: 'Double Down',
      description: '2x payout on your next winning bet. Stackable with other bonuses. Expires after one bet (win or lose).',
      price: 300,
      emoji: '2️⃣',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 3
    },
    {
      id: 'diamond-hands-multi',
      name: 'Diamond Hands',
      description: '1.5x payout on ALL bets for 24 hours. Stacks with other bonuses. Active immediately.',
      price: 400,
      emoji: '💎',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      sortOrder: 4
    },
    {
      id: 'lightning-round',
      name: 'Lightning Round',
      description: '5x payout on next win, but lose 2x stake if wrong. High risk, high reward. One-time use.',
      price: 500,
      emoji: '⚡',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      sortOrder: 5
    },
    {
      id: 'triple-threat-multi',
      name: 'Triple Threat',
      description: '3x payout on your next winning bet. Cannot stack with other multipliers. Expires after one bet.',
      price: 600,
      emoji: '3️⃣',
      itemType: ItemType.MULTIPLIER,
      category: ItemCategory.MULTIPLIERS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      sortOrder: 6
    }
  ],

  'tools': [
    {
      id: 'time-extension',
      name: 'Time Extension',
      description: 'Extend betting deadline by 1 hour (for yourself only). Gives you more time to decide. One-time use per bet.',
      price: 150,
      emoji: '⏱️',
      itemType: ItemType.TIME_EXTENSION,
      category: ItemCategory.BETTING_TOOLS,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'side-bet-creator',
      name: 'Side Bet Creator',
      description: 'Create a side bet within an existing bet. Earn credits if others join your side bet. 3 uses per purchase.',
      price: 200,
      emoji: '🎪',
      itemType: ItemType.SIDE_BET_CREATOR,
      category: ItemCategory.BETTING_TOOLS,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 2
    },
    {
      id: 'sure-shot-tool',
      name: 'Sure Shot',
      description: 'Place a bet with ZERO risk. If you win, get full payout. If you lose, stake is refunded. One-time use.',
      price: 400,
      emoji: '🎯',
      itemType: ItemType.SURE_SHOT,
      category: ItemCategory.BETTING_TOOLS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      sortOrder: 3
    }
  ],

  'discounts': [
    {
      id: 'half-price-ticket',
      name: 'Half-Price Ticket',
      description: 'Next bet stake costs 50% less. Still get full payout if you win. One-time use.',
      price: 80,
      emoji: '🎟️',
      itemType: ItemType.DISCOUNT_TICKET,
      category: ItemCategory.DISCOUNTS,
      rarity: Rarity.UNCOMMON,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'free-entry-pass',
      name: 'Free Entry Pass',
      description: 'Enter any bet completely free (0 stake). Win the full payout if correct. One-time use.',
      price: 150,
      emoji: '🎫',
      itemType: ItemType.DISCOUNT_TICKET,
      category: ItemCategory.DISCOUNTS,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 2
    },
    {
      id: 'refund-voucher',
      name: 'Refund Voucher',
      description: 'Get your stake back on next bet (win or lose). You keep winnings if you win. One-time use.',
      price: 200,
      emoji: '🎁',
      itemType: ItemType.DISCOUNT_TICKET,
      category: ItemCategory.DISCOUNTS,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 3
    },
    {
      id: 'vip-pass-7',
      name: 'VIP Pass (7 Days)',
      description: '10% discount on all bet stakes for 7 days. Full payouts on wins. Stackable with other discounts.',
      price: 300,
      emoji: '💳',
      itemType: ItemType.VIP_PASS,
      category: ItemCategory.DISCOUNTS,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 4
    },
    {
      id: 'vip-pass-30-disc',
      name: 'VIP Pass (30 Days)',
      description: '10% discount on all bet stakes for 30 days. Full payouts on wins. Stackable with other discounts.',
      price: 1000,
      emoji: '💳',
      itemType: ItemType.VIP_PASS,
      category: ItemCategory.DISCOUNTS,
      rarity: Rarity.LEGENDARY,
      isOwned: false,
      sortOrder: 5
    }
  ],

  'boosters': [
    {
      id: 'challenge-booster',
      name: 'Challenge Booster',
      description: 'Earn 50% more from completed challenges. Active for 7 days.',
      price: 150,
      emoji: '🏅',
      itemType: ItemType.CHALLENGE_BOOSTER,
      category: ItemCategory.BOOSTERS,
      rarity: Rarity.RARE,
      isOwned: false,
      sortOrder: 1
    },
    {
      id: 'daily-bonus-doubler',
      name: 'Daily Bonus Doubler',
      description: '2x daily login rewards for 14 days. Stacks with streaks.',
      price: 200,
      emoji: '🎁',
      itemType: ItemType.DAILY_BOOSTER,
      category: ItemCategory.BOOSTERS,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 2
    },
    {
      id: 'referral-multiplier',
      name: 'Referral Multiplier',
      description: 'Earn 2x credits from friend referrals. Active for 30 days. Stacks with normal referral bonus.',
      price: 300,
      emoji: '👥',
      itemType: ItemType.REFERRAL_BOOSTER,
      category: ItemCategory.BOOSTERS,
      rarity: Rarity.EPIC,
      isOwned: false,
      sortOrder: 3
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