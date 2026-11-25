import { Redirect } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';

/** Entry point: send the user to onboarding or the app shell. */
export default function Index() {
  const activeUserId = useSessionStore((state) => state.activeUserId);

  return <Redirect href={activeUserId ? '/(tabs)' : '/(auth)/welcome'} />;
}
