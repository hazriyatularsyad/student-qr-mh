import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// Decorative by default: the text or accessibilityLabel next to it carries the meaning.
export const Icon = ({ name, size = 22, color = colors.ink }: { name: IconName; size?: number; color?: string }) => (
  <Ionicons name={name} size={size} color={color} accessible={false} />
);
