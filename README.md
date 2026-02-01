# MediTrack - Comprehensive Pharmacy Management System

<div align="center">

![MediTrack](https://img.shields.io/badge/MediTrack-v0.5.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-green?style=for-the-badge)

**A modern, full-featured pharmacy management system built with cutting-edge technologies for exceptional user experience and high performance.**

[Getting Started](#-getting-started) •
[Features](#-features) •
[Documentation](#-documentation) •
[Tech Stack](#-technology-stack)

</div>

---

## 📋 Overview

MediTrack is a comprehensive pharmacy management solution designed to streamline inventory management, special orders, supplier relationships, and business analytics. Built with modern web technologies and packaged as a native desktop application, it delivers a responsive, fast, and secure experience for pharmacy professionals.

### Key Highlights

- 🌐 **Bilingual Support** - Full Arabic and English interface with RTL layout
- 🖥️ **Cross-Platform** - Native desktop apps for Windows, macOS, and Linux
- 🔄 **Auto Updates** - Secure automatic updates with signature verification
- 🔒 **Enterprise Security** - Input validation, secure authentication, and data protection
- ⚡ **Lightning Fast** - Built with Vite and TanStack for optimal performance

---

## ✨ Features

### 📦 Inventory Management

- Complete item catalog with stock tracking
- Real-time stock level monitoring
- Low stock and out-of-stock alerts
- Barcode support for quick lookups
- Price history tracking with automatic logging
- Stock adjustment with reason tracking

### � Item Inquiry System

- Advanced search by name, barcode, or generic name
- Real-time search results with debouncing
- Detailed item information view
- Stock and price history visualization
- Quick access to related actions

### 📊 Opening Balances

- Create and manage opening balance entries
- Two-step verification workflow (approve/reject)
- Support for multiple entry types:
  - Initial entries
  - Adjustments
  - Corrections
  - Reconciliations
- Automatic stock history integration

### � Medicine Forms Management

- Define medicine form types (tablets, capsules, syrups, etc.)
- Drag-and-drop reordering
- Active/inactive status management
- Bilingual names (English/Arabic)
- Custom display ordering

### � Manufacturer Management

- Complete manufacturer database
- Contact information management
- Country of origin tracking
- Product associations
- Filtering and pagination

### 📋 Special Orders

- Full order lifecycle management
- Multiple order statuses:
  - Pending
  - Ordered
  - Arrived
  - Delivered
  - Cancelled
- Multiple medicines per order
- Advanced search and filtering
- Order statistics dashboard

### 👥 Supplier Management

- Comprehensive supplier database
- Contact details (phone, WhatsApp, email)
- Medicine-supplier associations
- Performance ratings
- Delivery time tracking

### 📈 Reports & Analytics

- Detailed order reports
- Supplier performance analytics
- Interactive charts and graphs
- Data export capabilities
- Status distribution visualization

### ⚙️ System Settings

- **General Settings** - Application preferences
- **Order Settings** - Default values and behaviors
- **Supplier Settings** - Auto-suggest and defaults
- **Alert Settings** - Notification thresholds
- **Notification Settings** - Push notification configuration
- **Appearance** - Theme (dark/light) and language
- **System** - Import/export and developer options

### 🔄 Automatic Updates

- Secure encrypted updates
- Digital signature verification
- Manual update check in settings
- Cross-platform support

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.3.5 or later
- Node.js 18+ (for compatibility)
- Operating System: Windows 10/11, macOS 10.15+, or Linux

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd medi-order

# Install dependencies
bun install
```

### Development

```bash
# Run the web application
bun run dev:web

# Run the desktop application
cd apps/web
bun run desktop:dev

# Run all applications
bun run dev
```

The web application will be available at [http://localhost:3001](http://localhost:3001).

### Production Build

```bash
# Build all applications
bun run build

# Build desktop application
cd apps/web && bun run desktop:build
```

---

## 📁 Project Structure

```
medi-order/
├── apps/
│   └── web/                      # Main web application
│       ├── src/
│       │   ├── api/              # API layer and endpoints
│       │   ├── components/       # Reusable components
│       │   │   ├── auth/         # Authentication components
│       │   │   ├── data-display/ # Tables, grids, stats
│       │   │   ├── feedback/     # Dialogs, notifications
│       │   │   ├── forms/        # Form components
│       │   │   ├── layout/       # Layout components
│       │   │   ├── pharmacy/     # Pharmacy-specific components
│       │   │   └── ui/           # Base UI components (shadcn)
│       │   ├── hooks/            # Custom React hooks
│       │   ├── lib/              # Utilities and helpers
│       │   ├── providers/        # Context providers
│       │   ├── routes/           # Application pages
│       │   │   ├── inventory/    # Inventory module routes
│       │   │   └── onboarding/   # Onboarding flow
│       │   └── stores/           # State management
│       ├── src-tauri/            # Tauri configuration (Rust)
│       └── dist/                 # Build output
├── packages/
│   ├── config/                   # Shared configurations
│   ├── env/                      # Environment variables
│   └── i18n/                     # Internationalization
│       └── src/locales/          # Translation files (en/ar)
├── docker/                       # Docker configurations
├── scripts/                      # Build and utility scripts
└── docs/                         # Documentation
```

---

## 🛠️ Available Commands

### Development

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `bun run dev`         | Start all applications in development mode |
| `bun run dev:web`     | Start only the web application             |
| `bun run check-types` | Run TypeScript type checking               |

### Building

| Command                                | Description                           |
| -------------------------------------- | ------------------------------------- |
| `bun run build`                        | Build all applications for production |
| `cd apps/web && bun run desktop:build` | Build desktop application             |

### Testing

| Command                                | Description              |
| -------------------------------------- | ------------------------ |
| `cd apps/web && bun run test`          | Run test suite           |
| `cd apps/web && bun run test:ui`       | Run tests with UI        |
| `cd apps/web && bun run test:coverage` | Generate coverage report |

### Database (with Taskfile)

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `task docker:db:start` | Start PostgreSQL database      |
| `task db:setup`        | Initialize database schema     |
| `task db:migrate`      | Run database migrations        |
| `task seed`            | Seed database with sample data |

---

## � Technology Stack

### Frontend

| Technology      | Version | Purpose                 |
| --------------- | ------- | ----------------------- |
| React           | 19.2.3  | UI library              |
| TypeScript      | 5.x     | Type-safe JavaScript    |
| TanStack Router | Latest  | Type-safe routing       |
| TanStack Query  | Latest  | Data fetching & caching |
| TanStack DB     | Latest  | Reactive database       |
| Tailwind CSS    | 4.0     | Utility-first styling   |
| shadcn/ui       | Latest  | UI component library    |
| Zod             | Latest  | Schema validation       |

### Desktop

| Technology | Version | Purpose           |
| ---------- | ------- | ----------------- |
| Tauri      | 2.4.0   | Desktop framework |
| Rust       | Latest  | Backend runtime   |

### Build Tools

| Technology | Version | Purpose                   |
| ---------- | ------- | ------------------------- |
| Vite       | 6.2.2   | Build tool & dev server   |
| Turbo      | 2.6.3   | Monorepo build system     |
| Bun        | 1.3.5   | Package manager & runtime |

### Testing

| Technology      | Purpose           |
| --------------- | ----------------- |
| Vitest          | Test framework    |
| Testing Library | Component testing |
| Happy DOM       | DOM environment   |

---

## 🔒 Security

MediTrack follows industry best practices for security:

- ✅ **Input Validation** - All inputs validated with Zod schemas
- ✅ **Secure Error Handling** - No sensitive data in error messages
- ✅ **XSS Protection** - React's built-in sanitization
- ✅ **Secure Logging** - Audit trails without sensitive data
- ✅ **Environment Security** - Secure handling of environment variables
- ✅ **Update Verification** - Cryptographic signature verification for updates

---

## 🌍 Internationalization

MediTrack supports full internationalization with:

- **English (en)** - Complete English interface
- **Arabic (ar)** - Full Arabic translation with RTL layout

Translation files are located in `packages/i18n/src/locales/`.

---

## 📖 Documentation

| Document                                                       | Description               |
| -------------------------------------------------------------- | ------------------------- |
| [RELEASE_NOTES_v0.5.0.md](./RELEASE_NOTES_v0.5.0.md)           | Latest release notes      |
| [docs/MANUAL_RELEASE_GUIDE.md](./docs/MANUAL_RELEASE_GUIDE.md) | Manual release process    |
| [docs/TAURI_UPDATER_GUIDE.md](./docs/TAURI_UPDATER_GUIDE.md)   | Auto-update configuration |

---

## 🤝 Contributing

This is a proprietary project. For contribution inquiries, please contact the development team.

---

## 📄 License

All rights reserved © 2026

---

## 📞 Support

For technical support or inquiries:

- **Email**: dr.sabry1997@gmail.com
- **Phone**: +201030320366

---

<div align="center">

**Current Version**: 0.5.0 | **Last Updated**: February 2, 2026 | **Status**: ✅ Production Ready

Made with ❤️ by the MediTrack Team

</div>
