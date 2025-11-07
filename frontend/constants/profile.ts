/**
 * Profile-related constants
 */

export interface Achievement {
  title: string;
  desc: string;
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { title: 'First Win', desc: 'Won your first bet', color: '#FFD700' },
  { title: 'Hot Streak', desc: '5 wins in a row', color: '#FF6B6B' },
  { title: 'Big Winner', desc: 'Won $1000+ in a bet', color: '#4ECDC4' },
  { title: 'Social Star', desc: '100+ friends', color: '#45B7D1' }
];
