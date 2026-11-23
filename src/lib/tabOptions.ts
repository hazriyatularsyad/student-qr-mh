import { colors, fonts } from '@/theme';

export const tabScreenOptions = {
  sceneStyle: { backgroundColor: 'transparent', width: '100%' as const, maxWidth: 760, alignSelf: 'center' as const },
  headerStyle: { backgroundColor: 'rgba(255,246,224,0.75)' },
  headerTitleStyle: { fontFamily: fonts.display, color: colors.ink, fontWeight: '700' as const },
  tabBarStyle: { backgroundColor: 'rgba(255,246,224,0.85)', borderTopColor: colors.line },
  tabBarIcon: () => null,
  tabBarIconStyle: { display: 'none' as const },
  tabBarLabelStyle: { fontSize: 15, fontWeight: '700' as const, marginBottom: 14 },
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
};
