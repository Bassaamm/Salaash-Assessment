import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { OrdersSection } from './components/sections/OrdersSection';
import { NotificationsSection } from './components/sections/NotificationsSection';
import { ChannelsSection } from './components/sections/ChannelsSection';
import { Toaster } from './components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type Tab = 'orders' | 'notifications' | 'channels';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-3xl font-bold">Notifications Dashboard</h1>
            <p className="text-muted-foreground">
              Manage orders, notifications, and channels
            </p>
          </div>
        </header>

        <nav className="border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'channels'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Channels
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          {activeTab === 'orders' && <OrdersSection />}
          {activeTab === 'notifications' && <NotificationsSection />}
          {activeTab === 'channels' && <ChannelsSection />}
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
