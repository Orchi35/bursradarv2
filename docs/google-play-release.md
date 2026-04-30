# Google Play Store Release Checklist

Bu dosya BursRadar Android yayını için takip listesi olarak tutulur.

## Kalıcı Kararlar

- Android package/application id: `com.orchi35.bursradar`
- App name: `BursRadar`
- İlk Google Play upload'ından sonra package id değiştirilemez.
- Production build formatı: Android App Bundle (`.aab`).

## Güncel Google Play Gereksinimleri

- Yeni app ve update gönderimleri Android 15 / API 35 veya üzerini hedeflemelidir.
- Expo SDK 54 + EAS Build üretim profili bu hedefi Google Play uyumlu native build tarafında yönetir.
- Play Console tarafında Data safety, Privacy Policy, target audience ve content rating formları tamamlanmalıdır.

Kaynaklar:
- Google Play target API policy: https://support.google.com/googleplay/android-developer/answer/11926878
- Expo EAS Build config: https://docs.expo.dev/build/eas-json/
- Expo Android submit: https://docs.expo.dev/submit/android/

## Yerel Kontroller

```powershell
npm run check
npx expo export --platform web
```

## Android Build Komutları

Preview APK, telefona yükleyip test etmek için:

```powershell
npm run android:preview
```

Google Play için production AAB:

```powershell
npm run android:production
```

Google Play internal track'e draft submit:

```powershell
npm run android:submit
```

## Play Console Manuel Adımları

1. Google Play Developer hesabı aç.
2. Play Console'da yeni app oluştur: `BursRadar`.
3. Package id ile ilk build'i eşleştir: `com.orchi35.bursradar`.
4. Store listing doldur:
   - Kısa açıklama
   - Uzun açıklama
   - App icon
   - Feature graphic
   - Telefon ekran görüntüleri
5. Privacy Policy URL ekle.
6. Data safety formunu doldur:
   - Email ile authentication var.
   - Kullanıcı favori/hatırlatma tercihleri Supabase'de saklanıyor.
   - Bildirim izni kullanılıyor.
7. Content rating formunu tamamla.
8. Target audience seç.
9. Internal testing track'e `.aab` yükle.
10. Test kullanıcılarıyla login, favori, hatırlatma ve bildirim akışını doğrula.
11. Production'a çıkmadan önce `version` ve `android.versionCode` kontrol et.

## Dikkat Edilecekler

- `android.versionCode` her Play Store upload'ında artmalıdır.
- `eas.json` production build `autoIncrement: true` kullanır, ancak `app.json` içindeki başlangıç değeri `1` olarak tutulur.
- Service account key gibi Google credential dosyaları repoya eklenmemelidir.
- `.env.local` repoya eklenmemelidir.
