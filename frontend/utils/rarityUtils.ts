import { Rarity } from '../components/store/storeData';

// Re-export Rarity for convenience
export { Rarity };

// Type that accepts both Rarity enum or string
type RarityValue = Rarity | string;

/**
 * Get the text/border color for a given rarity level
 * Accepts both Rarity enum values and string values
 */
export const getRarityColor = (rarity: RarityValue): string => {
  switch (rarity) {
    case Rarity.COMMON:
    case 'COMMON': return '#9CA3AF';      // Gray
    case Rarity.UNCOMMON:
    case 'UNCOMMON': return '#10B981';    // Green
    case Rarity.RARE:
    case 'RARE': return '#3B82F6';        // Blue
    case Rarity.EPIC:
    case 'EPIC': return '#8B5CF6';        // Purple
    case Rarity.LEGENDARY:
    case 'LEGENDARY': return '#F59E0B';   // Orange/Gold
    default: return '#9CA3AF';
  }
};

/**
 * Get the background color (with opacity) for a given rarity level
 * Accepts both Rarity enum values and string values
 */
export const getRarityBgColor = (rarity: RarityValue): string => {
  switch (rarity) {
    case Rarity.COMMON:
    case 'COMMON': return 'rgba(156, 163, 175, 0.15)';
    case Rarity.UNCOMMON:
    case 'UNCOMMON': return 'rgba(16, 185, 129, 0.15)';
    case Rarity.RARE:
    case 'RARE': return 'rgba(59, 130, 246, 0.15)';
    case Rarity.EPIC:
    case 'EPIC': return 'rgba(139, 92, 246, 0.15)';
    case Rarity.LEGENDARY:
    case 'LEGENDARY': return 'rgba(245, 158, 11, 0.15)';
    default: return 'rgba(156, 163, 175, 0.15)';
  }
};

/**
 * Get both colors as an object (useful for memoization)
 */
export const getRarityColors = (rarity: RarityValue) => ({
  color: getRarityColor(rarity),
  bgColor: getRarityBgColor(rarity)
});
