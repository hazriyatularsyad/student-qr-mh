import { Alert, Platform } from 'react-native';

// Native dialog on phones, window.confirm in the browser preview.
export function confirmAction(title: string, message: string, onYes: () => void, yesLabel = 'Ya') {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Batal', style: 'cancel' },
    { text: yesLabel, style: 'destructive', onPress: onYes },
  ]);
}
