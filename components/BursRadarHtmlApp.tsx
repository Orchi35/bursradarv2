import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const LOCAL_HTML_PATH = '/bursradar/BursRadar.html';
const AUTH_CALLBACK_PATH = 'auth/callback';

function getWebHash() {
  if (typeof window === 'undefined') return '';
  return window.location.hash.includes('access_token=') ? window.location.hash : '';
}

function getNativeDevOrigin() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  return `http://${hostUri}`;
}

function getHtmlUri() {
  const configured = process.env.EXPO_PUBLIC_BURSRADAR_WEB_URL;
  if (configured) return configured;

  if (Platform.OS === 'web') {
    return `${LOCAL_HTML_PATH}${getWebHash()}`;
  }

  const devOrigin = getNativeDevOrigin();
  if (devOrigin) return `${devOrigin}${LOCAL_HTML_PATH}`;

  return 'https://bursradar.app';
}

export default function BursRadarHtmlApp() {
  const webViewRef = useRef<WebView>(null);
  const htmlUri = useMemo(getHtmlUri, []);
  const redirectTo = Linking.createURL(AUTH_CALLBACK_PATH);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {React.createElement('iframe', {
          src: htmlUri,
          title: 'BursRadar',
          style: styles.iframe,
          frameBorder: 0,
        })}
      </View>
    );
  }

  async function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type !== 'oauth' || typeof payload.url !== 'string') return;

      const result = await WebBrowser.openAuthSessionAsync(payload.url, redirectTo);
      if (result.type !== 'success' || !result.url) return;

      const callbackUrl = new URL(result.url);
      const hash = callbackUrl.hash || '';
      if (!hash.includes('access_token=')) return;
      webViewRef.current?.injectJavaScript(`window.location.hash = ${JSON.stringify(hash)}; window.BursRadarSupabase.getSession(); true;`);
    } catch (err) {
      console.warn('[BursRadarHtmlApp] OAuth flow could not be completed.', err);
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: htmlUri }}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        injectedJavaScriptBeforeContentLoaded={`window.BURSRADAR_AUTH_REDIRECT_TO = ${JSON.stringify(redirectTo)}; true;`}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    borderStyle: 'none',
  } as any,
  webview: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
});
