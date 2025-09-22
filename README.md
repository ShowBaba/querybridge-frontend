# QueryBridge Frontend

A modern React + TypeScript application built with Vite for managing API applications and custom logic.

## Tech Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **Lucide React** - Icon library

### Routing & State
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **@tanstack/react-query** - Server state management

### Forms & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### HTTP & API
- **Axios** - HTTP client with interceptors
- **MSW** - API mocking for development

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting rules

### Testing
- **Vitest** - Test runner
- **@testing-library/react** - React testing utilities
- **@testing-library/user-event** - User interaction testing
- **@testing-library/jest-dom** - Custom matchers

### Additional
- **clsx** - Conditional className utility
- **date-fns** - Date manipulation
- **react-hot-toast** - Toast notifications
- **@monaco-editor/react** - Code editor (placeholder)

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd querybridge-frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues automatically |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm prepare` | Setup Git hooks (Husky) |

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=QueryBridge
```

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080` |
| `VITE_APP_NAME` | Application name | `QueryBridge` |

## Project Structure

```
querybridge-frontend/
├── .editorconfig          # Editor configuration
├── .eslintrc.cjs          # ESLint configuration
├── .gitignore             # Git ignore rules
├── .prettierrc            # Prettier configuration
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── tsconfig.node.json     # TypeScript config for Node.js
├── vite.config.ts         # Vite configuration
├── .env.example           # Environment variables template
├── .env                   # Environment variables (local)
└── src/
    ├── main.tsx           # Application entry point
    ├── App.tsx            # Root component
    ├── index.css          # Global styles
    ├── app/               # Application configuration
    │   ├── config.ts      # Environment configuration
    │   ├── queryClient.ts # React Query client
    │   ├── router.tsx     # Route definitions
    │   ├── store.ts       # Zustand store
    │   ├── types.ts       # Shared types
    │   └── guards/        # Route guards
    │       └── AuthGuard.tsx
    ├── components/        # Reusable components
    │   ├── ui/            # Base UI components
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Tabs.tsx
    │   │   ├── Table.tsx
    │   │   └── ToastProvider.tsx
    │   └── AppShell/      # Layout components
    │       ├── AppShell.tsx
    │       ├── Sidebar.tsx
    │       └── Topbar.tsx
    ├── features/          # Feature-based modules
    │   ├── auth/          # Authentication
    │   │   ├── pages/     # Auth pages
    │   │   ├── components/ # Auth components
    │   │   ├── api.ts     # Auth API calls
    │   │   ├── hooks.ts   # Auth hooks
    │   │   └── types.ts   # Auth types
    │   ├── applications/  # Applications management
    │   │   └── pages/
    │   ├── application-detail/ # Application details
    │   │   └── pages/
    │   └── sandbox/       # Custom logic editor
    │       └── pages/
    ├── lib/               # Utility libraries
    │   ├── axios.ts       # HTTP client configuration
    │   ├── utils.ts       # Utility functions
    │   └── table.ts       # Table utilities
    ├── mocks/             # API mocking
    │   ├── browser.ts     # MSW browser setup
    │   └── handlers.ts    # Mock API handlers
    └── tests/             # Test files
        ├── setup.ts       # Test setup
        ├── AppShell.test.tsx
        └── router.test.tsx
```

## Features

### Authentication
- Sign in/Sign up forms
- Password reset flow
- Email verification
- Protected routes with AuthGuard

### Applications Management
- List applications in a grid layout
- Application detail view with tabs
- Placeholder for custom logic editor
- Analytics and settings placeholders

### UI Components
- Reusable component library
- Tailwind CSS styling
- Responsive design
- Dark/light theme support (basic)

### Development Features
- Hot module replacement
- TypeScript support
- ESLint and Prettier integration
- Testing setup with Vitest
- API mocking with MSW

## Routing

### Public Routes
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/verify-email` - Email verification

### Protected Routes (require authentication)
- `/` - Redirects to `/applications`
- `/applications` - Applications list
- `/applications/:appId` - Application detail
- `/applications/:appId/custom-logic` - Custom logic editor

## State Management

### Zustand Store
- UI preferences (sidebar state)
- Global application state

### React Query
- Server state management
- API data caching
- Background refetching
- Optimistic updates

## HTTP Client

The application uses Axios with configured interceptors:

- **Request interceptor**: Adds authentication token
- **Response interceptor**: Handles common errors (401, 403, 5xx)
- **Base configuration**: API base URL from environment variables

## Testing

Tests are configured with Vitest and React Testing Library:

- Component testing
- Router testing
- User interaction testing
- Mock API responses

Run tests:
```bash
pnpm test
```

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commit messages

## License

[Add your license information here]
