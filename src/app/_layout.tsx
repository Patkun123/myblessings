import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../../global.css';
import { LockScreen } from '@/components/auth/LockScreen';
import { Button } from '@/components/ui/Button';
import { SnackbarHost } from '@/components/ui/Snackbar';
import { colors } from '@/constants/theme';
import { openAppDatabase } from '@/db/client';
import { useSessionStore } from '@/stores/sessionStore';
import migrations from '../../drizzle/migrations';

/** Coming back within this window keeps the session unlocked. */
const RELOCK_AFTER_MS = 60_000;

type DbState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

export default function RootLayout() {
  const [dbState, setDbState] = useState<DbState>({ status: 'loading' });
  const [dbAttempt, setDbAttempt] = useState(0);

  const hydrated = useSessionStore((state) => state.hydrated);
  const locked = useSessionStore((state) => state.locked);
  const hydrateError = useSessionStore((state) => state.hydrateError);
  const hydrate = useSessionStore((state) => state.hydrate);
  const retryHydrate = useSessionStore((state) => state.retryHydrate);
  const lock = useSessionStore((state) => state.lock);

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
        if (!cancelled) {
          setDbState({
            status: 'error',
            message: cause instanceof Error ? cause.message : 'Could not open the database.',
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
    if (dbReady) void hydrate();
  }, [dbReady, hydrate]);

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
  } else if (!dbReady || !hydrated) {
    content = (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={colors.brand} />
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
            contentStyle: { backgroundColor: colors.canvas },
          }}
        />
        <SnackbarHost />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {content}
    </SafeAreaProvider>
  );
}
