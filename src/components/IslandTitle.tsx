import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

// Centered header title shaped like the iPhone Dynamic Island, finished as liquid glass:
// blur, a top sheen, a thin bright rim and a highlight line on the upper edge.
export function IslandTitle({ title }: { title: string }) {
  const pop = useRef(new Animated.Value(1)).current;

  // The pill springs when the title changes (it answers a navigation); skipped for reduced motion.
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!live || reduce) return;
      pop.setValue(0.9);
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 140, useNativeDriver: Platform.OS !== 'web' }).start();
    }).catch(() => {});
    return () => { live = false; };
  }, [title, pop]);

  return (
    <Animated.View style={[s.pill, { transform: [{ scale: pop }] }]}>
      <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.12)']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.sheen} pointerEvents="none" />
      <Text accessibilityRole="header" numberOfLines={1} style={s.text}>{title}</Text>
    </Animated.View>
  );
}

// Soft colour behind the pill, so the glass has something to refract.
export function HeaderGlow() {
  return (
    <View style={s.glow} pointerEvents="none">
      <View style={[s.spot, { left: '33%', backgroundColor: 'rgba(216,242,100,0.75)' }]} />
      <View style={[s.spot, { left: '56%', backgroundColor: 'rgba(175,162,255,0.7)' }]} />
      {/* blur over the colour spots turns hard circles into a soft glow */}
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    minWidth: 128,
    maxWidth: 230,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(10,10,11,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#D8F264',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  sheen: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.6)' },
  text: { color: colors.ink, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: colors.bg },
  spot: { position: 'absolute', top: 8, width: 50, height: 50, borderRadius: 25 },
});
