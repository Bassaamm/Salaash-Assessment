import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { channelsApi, type Channel } from '@/lib/api';

interface CreateNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    recipientId: string;
    channelId: string;
    templateName: string;
    data: Record<string, any>;
  }) => void;
  isLoading: boolean;
}

export function CreateNotificationDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateNotificationDialogProps) {
  const [formData, setFormData] = useState({
    recipientId: '',
    channelId: '',
    templateName: '',
    message: '',
  });

  // Fetch connected channels
  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll().then(res => res.data.filter(c => c.isActive)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate unique idempotency key using UUID
    const idempotencyKey = crypto.randomUUID();

    onSubmit({
      recipientId: formData.recipientId,
      channelId: formData.channelId,
      templateName: formData.templateName || 'manual-notification',
      data: {
        message: formData.message,
        timestamp: new Date().toISOString(),
      },
      idempotencyKey,
    } as any);
  };

  const resetForm = () => {
    setFormData({
      recipientId: '',
      channelId: '',
      templateName: '',
      message: '',
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const selectedChannel = channels.find(c => c.id === formData.channelId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Manual Notification</DialogTitle>
          <DialogDescription>
            Send a notification directly to a recipient through a connected channel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Channel Selection */}
            <div className="grid gap-2">
              <Label htmlFor="channel">
                Channel <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.channelId}
                onValueChange={(value) =>
                  setFormData({ ...formData, channelId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No connected channels available
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name} ({channel.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {channels.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Please connect a channel first in the Channels section.
                </p>
              )}
            </div>

            {/* Recipient Input */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="recipient">
                  Recipient <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Bulk Upload - Coming Soon
                  </Badge>
                </div>
              </div>
              <Input
                id="recipient"
                placeholder={
                  selectedChannel?.type === 'email'
                    ? 'customer@example.com'
                    : selectedChannel?.type === 'sms'
                    ? '+1234567890'
                    : selectedChannel?.type === 'push'
                    ? 'device-token-here'
                    : 'Recipient identifier'
                }
                value={formData.recipientId}
                onChange={(e) =>
                  setFormData({ ...formData, recipientId: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter email, phone number, or device token based on channel type
              </p>
            </div>

            {/* Template Name */}
            <div className="grid gap-2">
              <Label htmlFor="template">Template Name (Optional)</Label>
              <Input
                id="template"
                placeholder="e.g., welcome-message, promo-alert"
                value={formData.templateName}
                onChange={(e) =>
                  setFormData({ ...formData, templateName: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default template
              </p>
            </div>

            {/* Message Content */}
            <div className="grid gap-2">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="message"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your notification message here..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
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
            <Button type="submit" disabled={isLoading || channels.length === 0}>
              {isLoading ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
