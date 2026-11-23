import { colors } from '@/theme';

export const tabScreenOptions = (wide: boolean) => ({
  sceneStyle: { backgroundColor: 'transparent', width: '100%' as const, maxWidth: 1040, alignSelf: 'center' as const },
  headerShown: false,
  tabBarPosition: wide ? ('left' as const) : ('bottom' as const),
  tabBarIcon: () => null,
  tabBarIconStyle: { display: 'none' as const },
  tabBarLabelStyle: { fontSize: 16, fontWeight: '700' as const, ...(wide ? { marginLeft: 12 } : { marginBottom: 14 }) },
  tabBarStyle: { backgroundColor: 'rgba(255,246,224,0.6)', borderColor: 'rgba(255,255,255,0.7)' },
  tabBarActiveTintColor: colors.ink,
  tabBarActiveBackgroundColor: 'rgba(138,100,20,0.2)',
  tabBarInactiveTintColor: colors.muted,
});
