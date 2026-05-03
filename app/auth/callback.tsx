import { Redirect } from 'expo-router';
import React from 'react';

// OAuth deep-link callback handler.
// bursradar://auth/callback#access_token=... is captured by
// WebBrowser.openAuthSessionAsync in BursRadarHtmlApp — this route exists
// only as a fallback so Expo Router does not show the 404 screen.
export default function AuthCallbackScreen() {
  return <Redirect href="/" />;
}
