import { createElement } from 'react';
import type { ColorValue } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { LogoutButton } from '@/components/LogoutButton';
import { colors, fonts } from '@/theme';

// Bottom bar on every screen size: thumb reach at the gate, one pattern everywhere.
export const tabScreenOptions = {
  sceneStyle: { backgroundColor: 'transparent', width: '100%' as const, maxWidth: 1040, alignSelf: 'center' as const },
  headerShown: true,
  headerShadowVisible: false,
  headerTitleAlign: 'left' as const,
  headerStyle: { backgroundColor: 'rgba(255,246,224,0.72)', height: 64 },
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.ink },
  headerRight: () => createElement(LogoutButton),
  tabBarStyle: {
    backgroundColor: 'rgba(255,246,224,0.94)',
    borderTopColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarLabelStyle: { fontSize: 13, fontWeight: '700' as const },
  tabBarActiveTintColor: colors.goldDeep,
  tabBarInactiveTintColor: colors.muted,
};

// Filled icon when active, outline when not, so state never relies on colour alone.
export const tabIcon = (base: string) => ({ focused, color }: { focused: boolean; color: ColorValue }) =>
  createElement(Icon, { name: (focused ? base : `${base}-outline`) as IconName, size: 24, color: String(color) });
