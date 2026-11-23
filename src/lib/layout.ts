import { useWindowDimensions } from 'react-native';

export const WIDE = 900;
export const useWide = () => useWindowDimensions().width >= WIDE;
