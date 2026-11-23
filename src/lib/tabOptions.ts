import { createElement } from 'react';
import type { ColorValue } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { LogoutButton } from '@/components/LogoutButton';
import { colors } from '@/theme';

export const tabScreenOptions = {
  sceneStyle: { backgroundColor: colors.bg, width: '100%' as const, maxWidth: 1040, alignSelf: 'center' as const },
  headerShown: true,
  headerShadowVisible: false,
  headerTitleAlign: 'left' as const,
  // navy bar with a thin pearl-gold rule underneath
  headerStyle: { backgroundColor: colors.navy, height: 64, borderBottomWidth: 3, borderBottomColor: colors.gold },
  headerTitleStyle: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.2, color: '#FFFFFF' },
  headerRight: () => createElement(LogoutButton),
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarLabelStyle: { fontSize: 12.5, fontWeight: '700' as const },
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
};

// Filled icon when active, outline when not, so state never relies on colour alone.
export const tabIcon = (base: string) => ({ focused, color }: { focused: boolean; color: ColorValue }) =>
  createElement(Icon, { name: (focused ? base : `${base}-outline`) as IconName, size: 24, color: String(color) });
