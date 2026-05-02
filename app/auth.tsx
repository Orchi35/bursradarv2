import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; mode?: string }>();
  const returnTo = typeof params.returnTo === 'string' && params.returnTo.startsWith('/') ? params.returnTo : '/';
  const mode = typeof params.mode === 'string' ? params.mode : 'login';
  const href = `/account?mode=${encodeURIComponent(mode)}&returnTo=${encodeURIComponent(returnTo)}`;

  return <Redirect href={href as any} />;
}
