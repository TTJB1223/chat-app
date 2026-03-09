import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { TextDecoder, TextEncoder } from 'text-encoding';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as any;
}

if (typeof navigator !== 'undefined' && !navigator.userAgent) {
  (navigator as any).userAgent = 'ReactNative';
}

if (typeof AbortSignal !== 'undefined') {
  if (!AbortSignal.prototype.throwIfAborted) {
    AbortSignal.prototype.throwIfAborted = function () {
      if (this.aborted) {
        throw this.reason || new Error('Operation was aborted');
      }
    };
  }
}

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from 'nativewind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


import { initDb } from '@/services/db';

// ... (imports)

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);


  useEffect(() => {
    async function prepare() {
      try {
        await initDb(); // Initialize SQLite DB
      } catch (e) {
        console.warn(e);
      } finally {
        if (loaded) {
          SplashScreen.hideAsync();
        }
      }
    }

    if (loaded) {
      prepare();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }


  return <RootLayoutNav />;
}


import { SettingsProvider } from '@/services/SettingsContext';

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();

  return (
    <SettingsProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </SettingsProvider>
  );
}
