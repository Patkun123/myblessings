import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../../global.css';
import { LockScreen } from '@/components/auth/LockScreen';
import { Button } from '@/components/ui/Button';
import { Sidebar } from '@/components/ui/Sidebar';
import { SnackbarHost } from '@/components/ui/Snackbar';
import { openAppDatabase } from '@/db/client';
import { loadUserTheme } from '@/db/queries/profile';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeColors, useThemeStore } from '@/stores/themeStore';
import migrations from '../../drizzle/migrations';

/** Coming back within this window keeps the session unlocked. */
const RELOCK_AFTER_MS = 60_000;

/** Flattens Drizzle's `cause` chain into one readable message. */
function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current instanceof Error && depth < 4; depth += 1) {
    const text = current.message.trim();
    if (text && !parts.includes(text)) parts.push(text);
    current = (current as { cause?: unknown }).cause;
  }
  return parts.join('\n\n') || 'Could not open the database.';
}

type DbState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  const [dbState, setDbState] = useState<DbState>({ status: 'loading' });
  const [dbAttempt, setDbAttempt] = useState(0);

  const activeUserId = useSessionStore((state) => state.activeUserId);
  const hydrated = useSessionStore((state) => state.hydrated);
  const locked = useSessionStore((state) => state.locked);
  const hydrateError = useSessionStore((state) => state.hydrateError);
  const hydrate = useSessionStore((state) => state.hydrate);
  const retryHydrate = useSessionStore((state) => state.retryHydrate);
  const lock = useSessionStore((state) => state.lock);

  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);
  const { colorScheme, setColorScheme } = useColorScheme();
  const themeColors = useThemeColors();
  const resolvedScheme = colorScheme === 'light' ? 'light' : 'dark';

  /**
   * Open the connection, then migrate. Both steps must finish before any screen
   * renders: on web the SQLite worker is asynchronous, and Drizzle's driver is
   * synchronous, so a query issued too early would throw.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const database = await openAppDatabase();
        await migrate(database, migrations);
        if (!cancelled) setDbState({ status: 'ready' });
      } catch (cause) {
        // Drizzle wraps driver errors, so the useful SQLite message lives on
        // `cause`. Log the whole chain for debugging; show it plus the wrapper.
        console.error('[db] open/migrate failed', cause);
        if (!cancelled) {
          setDbState({
            status: 'error',
            message: describeError(cause),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dbAttempt]);

  // Route decisions wait for the database, so the lock screen never sits over an
  // unmigrated (or unopened) database.
  const dbReady = dbState.status === 'ready';
  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;

    (async () => {
      await hydrate();
      const userId = useSessionStore.getState().activeUserId;
      if (!cancelled && userId) {
        try {
          const theme = await loadUserTheme(userId);
          if (!cancelled) setThemePreference(theme);
        } catch (cause) {
          console.warn('[theme] failed to load user theme', cause);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dbReady, hydrate, setThemePreference]);

  // Keep theme synced when switching or creating profiles after launch.
  useEffect(() => {
    if (!dbReady || !activeUserId) return;
    let cancelled = false;

    loadUserTheme(activeUserId)
      .then((theme) => {
        if (!cancelled) setThemePreference(theme);
      })
      .catch((cause) => {
        console.warn('[theme] failed to sync user theme', cause);
      });

    return () => {
      cancelled = true;
    };
  }, [dbReady, activeUserId, setThemePreference]);

  useEffect(() => {
    try {
      setColorScheme(themePreference);
    } catch {
      // Ignore in non-browser environments without window.
    }
  }, [themePreference, setColorScheme]);

  // NativeWind's web colorScheme.set('system') strips `.dark`; ensure `<html>` stays synced.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', resolvedScheme === 'dark');
    }
  }, [resolvedScheme]);

  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next === 'active' && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= RELOCK_AFTER_MS) lock();
      }
    });
    return () => subscription.remove();
  }, [lock]);

  let content: ReactNode;

  if (dbState.status === 'error') {
    content = (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-center text-lg font-semibold text-expense">Database error</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ink-muted">{dbState.message}</Text>
        <View className="mt-6 w-full max-w-xs">
          <Button
            label="Try again"
            onPress={() => {
              setDbState({ status: 'loading' });
              setDbAttempt((attempt) => attempt + 1);
            }}
          />
        </View>
      </View>
    );
  } else if (hydrateError) {
    content = (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-center text-lg font-semibold text-ink">Cannot open the app lock</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ink-muted">{hydrateError}</Text>
        <View className="mt-6 w-full max-w-xs">
          <Button label="Try again" onPress={() => void retryHydrate()} />
        </View>
      </View>
    );
  } else if (!dbReady || !hydrated || !fontsReady) {
    content = (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={themeColors.brand} />
      </View>
    );
  } else if (locked) {
    content = <LockScreen />;
  } else {
    content = (
      <>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: themeColors.canvas },
          }}
        />
        <Sidebar />
        <SnackbarHost />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      {content}
    </SafeAreaProvider>
  );
}
