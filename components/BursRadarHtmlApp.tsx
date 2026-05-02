import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const LOCAL_HTML_PATH = '/bursradar/BursRadar.html';
const AUTH_CALLBACK_PATH = 'auth/callback';
const REQUIRED_HTML_URL_MESSAGE =
  'Production mobil build icin EXPO_PUBLIC_BURSRADAR_WEB_URL tanimli olmali.';

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

  return null;
}

export default function BursRadarHtmlApp() {
  const webViewRef = useRef<WebView>(null);
  const htmlUri = useMemo(getHtmlUri, []);
  const redirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (!htmlUri) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>BursRadar acilamadi</Text>
        <Text style={styles.fallbackText}>{REQUIRED_HTML_URL_MESSAGE}</Text>
      </View>
    );
  }

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
      webViewRef.current?.injectJavaScript(`window.location.hash = ${JSON.stringify(hash)}; window.location.reload(); true;`);
    } catch (err) {
      console.warn('[BursRadarHtmlApp] OAuth flow could not be completed.', err);
      setLoadError('Google ile oturum acma tamamlanamadi. Lutfen tekrar deneyin.');
    }
  }

  return (
    <View style={styles.container}>
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}
      <WebView
        ref={webViewRef}
        source={{ uri: htmlUri }}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        originWhitelist={['https://*', 'http://*', 'bursradar://*']}
        setSupportMultipleWindows={false}
        injectedJavaScriptBeforeContentLoaded={`window.BURSRADAR_AUTH_REDIRECT_TO = ${JSON.stringify(redirectTo)}; true;`}
        onMessage={handleMessage}
        onError={() => setLoadError('BursRadar arayuzu yuklenemedi. Internet baglantinizi kontrol edin.')}
        onHttpError={() => setLoadError('BursRadar arayuzu sunucudan yuklenemedi.')}
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
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  fallbackTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  fallbackText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderBottomColor: '#fecaca',
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
