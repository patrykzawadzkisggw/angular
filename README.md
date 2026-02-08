# E-Commerce Angular Application

A modern, full-featured e-commerce web application built with Angular 20, providing a seamless shopping experience with product browsing, cart management, and order processing.

## 📋 Overview

This project is a comprehensive e-commerce platform that allows users to browse products, manage their shopping cart, and complete orders. It features user authentication, product filtering and search capabilities, order tracking, and a responsive design using PrimeNG components and Tailwind CSS.

## ✨ Key Features

- **Product Management**
  - Browse products with detailed information
  - Advanced filtering (price range, categories, stock availability)
  - Product search functionality
  - View product details including images, pricing, and stock information
  
- **Shopping Cart**
  - Add/remove items from cart
  - Update quantities
  - Real-time cart updates
  - Promo code support

- **User Authentication**
  - User registration and login
  - Protected routes with authentication guards
  - Session management

- **Order Management**
  - Place orders with delivery information
  - View order history
  - Track order status
  - Detailed order information

- **User Interface**
  - Responsive design
  - Modern UI with PrimeNG components
  - Cookie consent banner
  - Custom directives and pipes

## 🛠️ Technology Stack

- **Frontend Framework**: Angular 20.3.7
- **UI Components**: PrimeNG 20.2.0
- **Styling**: 
  - Tailwind CSS 3.4.13
  - PrimeFlex 4.0.0
  - SCSS
- **State Management**: RxJS 7.8.0
- **Testing**: Jasmine & Karma
- **Build Tool**: Angular CLI 20.3.7
- **Language**: TypeScript 5.9.2

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (LTS version recommended)
- **npm** (comes with Node.js)
- **Angular CLI** (`npm install -g @angular/cli`)

## 🚀 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd angular
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment settings:
   - Review and update `src/environments/environment.ts` for production
   - Review and update `src/environments/environment.development.ts` for development

## 💻 Development

### Start Development Server

To start a local development server, run:

```bash
npm start
# or
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the project for production
- `npm run watch` - Build in watch mode with development configuration
- `npm test` - Run unit tests

## 🏗️ Building

To build the project for production:

```bash
npm run build
# or
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. The production build is optimized for performance and speed.

## 🧪 Testing

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner:

```bash
npm test
# or
ng test
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/        # Reusable UI components
│   │   ├── navbar-component/
│   │   ├── filter-drawer/
│   │   ├── cookie-banner/
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── home-page/
│   │   ├── product-page/
│   │   ├── cart-page/
│   │   ├── login-page/
│   │   ├── orders-page/
│   │   └── ...
│   ├── services/         # Application services
│   │   ├── product-service.ts
│   │   ├── cart-service.ts
│   │   ├── auth-service.ts
│   │   └── order-service.ts
│   ├── guards/           # Route guards
│   ├── directives/       # Custom directives
│   ├── pipes/           # Custom pipes
│   ├── app.routes.ts    # Application routes
│   └── app.config.ts    # App configuration
├── environments/         # Environment configurations
└── assets/              # Static assets
```

## 🔒 Authentication

The application includes authentication functionality with:
- Route guards (`authGuard`, `loggedInAuthGuard`)
- HTTP interceptor for authentication tokens
- Protected routes for cart, orders, and delivery

## 🌐 Deployment

The project is configured for deployment on Netlify (see `netlify.toml`).

To deploy:
1. Build the production version: `npm run build`
2. Deploy the contents of the `dist/` directory to your hosting platform

## 📝 Code Scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`):

```bash
ng generate --help
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Additional Resources

- [Angular Documentation](https://angular.dev)
- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 📄 License

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6.
