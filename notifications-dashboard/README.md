# Notifications Dashboard

A React-based dashboard for managing orders, notifications, and channels in the notification service.

## Tech Stack

- **React 18** with TypeScript
- **Vite 7** - Build tool
- **Tailwind CSS v3** - Styling
- **shadcn/ui** - UI Components
- **React Query (TanStack Query)** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide React** - Icons

## Features

### 1. Order Management
- View all orders in a paginated table
- Create new orders to trigger notification events
- Filter by status (Pending, Processing, Shipped, Delivered, Cancelled)
- Search by user ID or order number
- Real-time pagination with next/previous controls

### 2. Notifications/Events
- View all notification events in a paginated table
- Filter by status (Pending, Sent, Failed, Processing)
- Search by recipient ID
- See retry counts and timestamps
- Track delivery status per channel

### 3. Channels
- Card-based layout showing all configured channels
- Visual status indicators (Active/Inactive)
- Support for Email, SMS, and Push channels
- Display channel configuration details
- Channel type icons

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at http://localhost:3001

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── sections/        # Main section components
│   │   ├── OrdersSection.tsx
│   │   ├── NotificationsSection.tsx
│   │   └── ChannelsSection.tsx
│   └── dialogs/         # Modal dialogs
│       └── CreateOrderDialog.tsx
├── lib/
│   ├── api.ts          # API client and types
│   └── utils.ts        # Utility functions
├── App.tsx             # Main application component
└── index.css           # Global styles with Tailwind
```

## API Integration

The dashboard proxies API requests to `http://localhost:3000`. Make sure the backend is running before starting the dashboard.

### Endpoints Used

- `GET /api/orders?page=1&limit=10&search=&status=` - List orders with pagination
- `POST /api/orders` - Create new order
- `GET /api/notifications?page=1&limit=10&search=&status=` - List notifications with pagination
- `GET /api/channels` - List all channels

## Environment Variables

The API proxy is configured in `vite.config.ts`. Modify it if you need a different backend URL:

```typescript
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## Development Notes

- All shadcn/ui components are installed via CLI: `npx shadcn@latest add [component]`
- Pagination is handled server-side with query parameters
- React Query automatically caches and refetches data
- TypeScript strict mode is enabled
