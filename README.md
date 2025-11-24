# 💰 Butcele - Modern Bütçe Yönetim Uygulaması

<div align="center">

![Butcele Logo](public/logo.svg)

**Harcamalarını Geleceğe Taşı**

[🚀 Demo](https://butcele.netlify.app/) | [📖 Dokümantasyon](#özellikler) | [🐛 Hata Bildir](https://github.com/mustafagonen/butceleAI/issues)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📋 İçindekiler

- [Hakkında](#-hakkında)
- [Özellikler](#-özellikler)
- [Demo](#-demo)
- [Teknolojiler](#-teknolojiler)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

---

## 🎯 Hakkında

**Butcele**, gelir ve giderlerinizi modern, hızlı ve şık bir arayüzle yönetmenizi sağlayan yeni nesil bir bütçe takip uygulamasıdır. Finansal özgürlüğünüze giden yolda en iyi yardımcınız!

### Neden Butcele?

- 🎨 **Modern ve Şık Tasarım** - Gözünüzü yormayan, kullanımı keyifli arayüz
- ⚡ **Hızlı ve Performanslı** - Next.js 16 ile optimize edilmiş performans
- 🌙 **Çoklu Tema Desteği** - Light, Dark ve Futuristic modlar
- 📱 **Responsive Tasarım** - Her cihazda mükemmel görünüm
- 🔐 **Güvenli** - Firebase Authentication ile korumalı verileriniz
- 📊 **Detaylı Analizler** - Harcamalarınızı kategorilere göre analiz edin
- 💳 **Ekstre Yükleme** - PDF banka ekstrelerini otomatik olarak işleyin
- 💼 **Portföy Yönetimi** - Varlıklarınızı (altın, döviz, hisse, kripto) takip edin

---

## ✨ Özellikler

### 💸 Gelir & Gider Yönetimi
- ✅ Hızlı gelir/gider ekleme
- ✅ Kategori bazlı filtreleme
- ✅ Ödeme yöntemi takibi
- ✅ Detaylı arama ve filtreleme
- ✅ Aylık bazda görüntüleme
- ✅ Toplu silme işlemleri

### 📄 Ekstre İşleme
- ✅ PDF banka ekstresi yükleme
- ✅ Otomatik işlem çıkarma
- ✅ Akıllı kategori eşleştirme
- ✅ Manuel düzenleme imkanı

### 💼 Portföy Takibi
- ✅ Altın, Döviz, BES, Hisse, Kripto takibi
- ✅ Güncel piyasa fiyatları
- ✅ Otomatik değer hesaplama
- ✅ Borç yönetimi
- ✅ Finansal özgürlük hedefi

### 📊 Dashboard & Raporlama
- ✅ Aylık özet görünümü
- ✅ Gelir/gider karşılaştırması
- ✅ Kategori bazlı grafikler
- ✅ Trend analizleri

### 🎨 Kullanıcı Deneyimi
- ✅ 3 farklı tema (Light, Dark, Futuristic)
- ✅ Smooth animasyonlar
- ✅ Glassmorphism tasarım
- ✅ Responsive layout
- ✅ Türkçe dil desteği

---

## 🚀 Demo

Uygulamayı hemen deneyin: **[https://butcele.netlify.app/](https://butcele.netlify.app/)**

> **Not:** Demo için Google hesabınızla giriş yapabilirsiniz.

---

## 🛠 Teknolojiler

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework
- **[React 19.2](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[React Icons](https://react-icons.github.io/react-icons/)** - Icon library

### Backend & Services
- **[Firebase](https://firebase.google.com/)** - Backend as a Service
  - Authentication (Google OAuth)
  - Firestore Database
  - Hosting
- **[Netlify](https://www.netlify.com/)** - Deployment & Hosting

### Utilities
- **[Zod](https://zod.dev/)** - Schema validation
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** - PDF processing
- **[clsx](https://github.com/lukeed/clsx)** - Conditional classnames
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Tailwind class merging

---

## 📦 Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Firebase projesi

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone https://github.com/mustafagonen/butceleAI.git
cd butceleAI
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
# veya
yarn install
```

3. **Firebase yapılandırması**

`src/lib/firebase.ts` dosyasında Firebase config bilgilerinizi güncelleyin:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. **Firestore kurallarını ayarlayın**

`firestore.rules` dosyasındaki kuralları Firebase Console'dan yükleyin.

5. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
# veya
yarn dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

---

## 🎮 Kullanım

### İlk Adımlar

1. **Giriş Yapın** - Google hesabınızla giriş yapın
2. **Gelir/Gider Ekleyin** - İlk işlemlerinizi ekleyin
3. **Portföy Oluşturun** - Varlıklarınızı kaydedin
4. **Hedef Belirleyin** - Finansal özgürlük hedefinizi ayarlayın

### Ekstre Yükleme

1. Harcamalar sayfasından "Ekstre Yükle" butonuna tıklayın
2. PDF banka ekstrenizi seçin
3. Otomatik çıkarılan işlemleri gözden geçirin
4. Gerekirse düzenleyin ve kaydedin

### Portföy Yönetimi

1. Portföy sayfasından "Yeni Varlık" ekleyin
2. Varlık türünü seçin (Altın, Döviz, BES, vb.)
3. Miktar ve detayları girin
4. Güncel değerleri otomatik olarak görün

---

## 📸 Ekran Görüntüleri

<div align="center">

### 🏠 Ana Sayfa
![Ana Sayfa](docs/screenshots/home.png)

### 📊 Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### 💸 Harcamalar
![Harcamalar](docs/screenshots/expenses.png)

### 💼 Portföy
![Portföy](docs/screenshots/portfolio.png)

</div>

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Commit Mesajları

Conventional Commits formatını kullanıyoruz:

- `feat:` - Yeni özellik
- `fix:` - Hata düzeltme
- `docs:` - Dokümantasyon
- `style:` - Kod formatı
- `refactor:` - Kod iyileştirme
- `test:` - Test ekleme
- `chore:` - Genel işler

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👨‍💻 Geliştirici

**Mustafa Gönen**

- GitHub: [@mustafagonen](https://github.com/mustafagonen)
- LinkedIn: [Mustafa Gönen](https://www.linkedin.com/in/mustafagonen)

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) ekibine harika framework için
- [Firebase](https://firebase.google.com/) ekibine backend altyapısı için
- [Tailwind CSS](https://tailwindcss.com/) ekibine muhteşem CSS framework'ü için
- Tüm açık kaynak katkıda bulunanlara

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın! ⭐**

Made with ❤️ in Turkey

</div>
