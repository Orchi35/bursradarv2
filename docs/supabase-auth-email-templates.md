# Supabase Auth Email Templates

Supabase Dashboard -> Authentication -> Emails -> Templates alaninda
Confirm signup template'i icin asagidaki degerleri kullan.

## Confirm Signup Subject

```text
BursRadar hesabınızı doğrulayın
```

## Confirm Signup Body

```html
<div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5edf7;">
          <tr>
            <td style="background:#1A3A6B;padding:28px 30px;color:#ffffff;">
              <div style="font-size:24px;font-weight:800;letter-spacing:.2px;">BursRadar</div>
              <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#dbeafe;">İzmir özel okul bursluluk sınavlarını güvenle takip edin.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 30px 10px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">Hesabınızı doğrulayın</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#475569;">
                BursRadar hesabınızı etkinleştirmek için aşağıdaki butona tıklayın.
              </p>
              <p style="margin:0 0 26px;font-size:14px;line-height:1.6;color:#64748b;">
                Bu işlem, hesabınızın güvenliği için yalnızca birkaç saniye sürer.
              </p>
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px;">
                Hesabımı Doğrula
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 30px 30px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırabilirsiniz:
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#2563EB;word-break:break-all;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e5edf7;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                Bu e-posta, BursRadar hesabı oluşturduğunuz için gönderildi. Bu işlemi siz başlatmadıysanız e-postayı yok sayabilirsiniz.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
```

## Notes

- `{{ .ConfirmationURL }}` Supabase tarafindan otomatik uretilen dogrulama linkidir.
- Supabase dokumanina gore auth mail template'leri Go Template degiskenleri kullanir.
- Daha kurumsal gonderici adi icin Authentication -> SMTP Settings tarafinda ozel SMTP/Resend yapilandirmasi gerekir.
