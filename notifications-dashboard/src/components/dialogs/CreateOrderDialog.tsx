import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { channelsApi, type Order, type Channel } from '@/lib/api';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Order>) => void;
  isLoading: boolean;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateOrderDialogProps) {
  const [formData, setFormData] = useState({
    userId: '',
    total: '',
    notes: '',
  });

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [useAllChannels, setUseAllChannels] = useState(true);

  // Fetch connected channels
  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll().then(res => res.data.filter(c => c.isActive)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId: formData.userId,
      total: parseFloat(formData.total),
      notes: formData.notes || undefined,
      channelIds: useAllChannels ? [] : selectedChannels,
    } as any);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      total: '',
      notes: '',
    });
    setSelectedChannels([]);
    setUseAllChannels(true);
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  // Auto-select all when switching to "use all"
  useEffect(() => {
    if (useAllChannels) {
      setSelectedChannels([]);
    }
  }, [useAllChannels]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Create a new order to test the notification system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">User ID / Email</Label>
              <Input
                id="userId"
                placeholder="customer@example.com"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total">Total Amount</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                placeholder="99.99"
                value={formData.total}
                onChange={(e) =>
                  setFormData({ ...formData, total: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {/* Channel Selection */}
            <div className="grid gap-3 border-t pt-4">
              <Label>Notification Channels</Label>

              {/* All Channels Option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-channels"
                  checked={useAllChannels}
                  onCheckedChange={(checked) => setUseAllChannels(!!checked)}
                />
                <label
                  htmlFor="all-channels"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use all connected channels ({channels.length})
                </label>
              </div>

              {/* Individual Channels */}
              {!useAllChannels && (
                <div className="ml-6 grid gap-2">
                  {channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No connected channels. Please connect a channel first.
                    </p>
                  ) : (
                    channels.map((channel) => (
                      <div key={channel.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`channel-${channel.id}`}
                          checked={selectedChannels.includes(channel.id)}
                          onCheckedChange={() => toggleChannel(channel.id)}
                        />
                        <label
                          htmlFor={`channel-${channel.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {channel.name} ({channel.type})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
