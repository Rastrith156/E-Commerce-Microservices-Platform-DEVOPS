# E-Commerce Frontend

React + Vite + TypeScript frontend for the E-Commerce Microservices Platform.

## Features

- Product catalog browsing with pagination
- Shopping cart management (add, update, remove items)
- Checkout with idempotent order creation
- Correlation ID tracking for distributed tracing
- Structured API error handling
- Responsive UI with Indian Rupee (INR) currency formatting

## Technology stack

- React 18
- Vite
- TypeScript (strict mode)
- React Router DOM
- Vitest + React Testing Library

## Getting started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview production build
npm run preview
```

## Configuration

| Environment variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for backend API | `/api` |

The development Vite server proxies `/api` requests to `http://localhost:8080`.

## Project structure

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Routing
│   ├── api.ts            # API client with correlation IDs
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Correlation ID utilities
│   ├── hooks/            # Custom React hooks (useProducts, useCart, useOrders)
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (Home, Cart, Checkout)
│   └── __tests__/        # Unit and component tests
```

## Testing

Tests use Vitest with jsdom and React Testing Library. Run with:

```bash
npm test
```

## Security notes

- Correlation IDs are stored in `sessionStorage` and sent as `X-Correlation-ID` headers on every API request.
- No credentials or tokens are stored in localStorage.
- All API errors are caught and displayed with structured error messages.
- Keep `VITE_API_BASE_URL` pointing to internal service endpoints only; never expose backend URLs in client-side code.
