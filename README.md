# 💰 Butcele - Modern Budget Management App

<div align="center">

**Take Your Expenses to the Future**

[🚀 Live Demo](https://butcele.netlify.app/) | [📖 Documentation](#features) | [🐛 Report Bug](https://github.com/mustafagonen/butceleAI/issues)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

**Butcele** is a next-generation budget tracking application that allows you to manage your income and expenses with a modern, fast, and elegant interface. Your best companion on the road to financial freedom!

### Why Butcele?

- 🎨 **Modern & Elegant Design** - Eye-friendly, enjoyable interface
- ⚡ **Fast & Performant** - Optimized performance with Next.js 16
- 🌙 **Multi-Theme Support** - Light, Dark, and Futuristic modes
- 📱 **Responsive Design** - Perfect view on every device
- 🔐 **Secure** - Your data protected with Firebase Authentication
- 📊 **Detailed Analytics** - Analyze your expenses by categories
- 💳 **Statement Upload** - Automatically process PDF bank statements
- 💼 **Portfolio Management** - Track your assets (gold, forex, stocks, crypto)

---

## ✨ Features

### 💸 Income & Expense Management
- ✅ Quick income/expense entry
- ✅ Category-based filtering
- ✅ Payment method tracking
- ✅ Advanced search and filtering
- ✅ Monthly view
- ✅ Bulk delete operations

### 📄 Statement Processing
- ✅ PDF bank statement upload
- ✅ Automatic transaction extraction
- ✅ Smart category matching
- ✅ Manual editing capability

### 💼 Portfolio Tracking
- ✅ Track Gold, Forex, BES, Stocks, Crypto
- ✅ Real-time market prices
- ✅ Automatic value calculation
- ✅ Debt management
- ✅ Financial freedom goal

### 📊 Dashboard & Reporting
- ✅ Monthly summary view
- ✅ Income/expense comparison
- ✅ Category-based charts
- ✅ Trend analysis

### 🎨 User Experience
- ✅ 3 different themes (Light, Dark, Futuristic)
- ✅ Smooth animations
- ✅ Glassmorphism design
- ✅ Responsive layout
- ✅ Turkish language support

---

## 🚀 Live Demo

Try the app now: **[https://butcele.netlify.app/](https://butcele.netlify.app/)**

> **Note:** You can sign in with your Google account for the demo.

---

## 🛠 Tech Stack

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

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/mustafagonen/butceleAI.git
cd butceleAI
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Firebase configuration**

Update your Firebase config in `src/lib/firebase.ts`:

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

4. **Set up Firestore rules**

Upload the rules from `firestore.rules` file via Firebase Console.

5. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## 🎮 Usage

### Getting Started

1. **Sign In** - Sign in with your Google account
2. **Add Income/Expenses** - Add your first transactions
3. **Create Portfolio** - Register your assets
4. **Set Goals** - Set your financial freedom goal

### Statement Upload

1. Click "Upload Statement" button from expenses page
2. Select your PDF bank statement
3. Review automatically extracted transactions
4. Edit if necessary and save

### Portfolio Management

1. Add "New Asset" from portfolio page
2. Select asset type (Gold, Forex, BES, etc.)
3. Enter amount and details
4. View current values automatically

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Messages

We use Conventional Commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - General tasks

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Mustafa Gönen**

- GitHub: [@mustafagonen](https://github.com/mustafagonen)
- LinkedIn: [Mustafa Gönen](https://www.linkedin.com/in/mustafagonen)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Firebase](https://firebase.google.com/) team for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) team for the awesome CSS framework
- All open source contributors

---

<div align="center">

**⭐ Don't forget to star the project if you like it! ⭐**

Made with ❤️ in Turkey

</div>
