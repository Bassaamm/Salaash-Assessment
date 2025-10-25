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
import type { AvailableChannel } from '@/lib/api';

interface ConnectChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: AvailableChannel | null;
  onSubmit: (data: { type: string; name: string; configuration: Record<string, any> }) => void;
  isLoading: boolean;
}

export function ConnectChannelDialog({
  open,
  onOpenChange,
  channel,
  onSubmit,
  isLoading,
}: ConnectChannelDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    configuration: {} as Record<string, any>,
  });

  useEffect(() => {
    if (channel) {
      setFormData({
        name: `${channel.name.charAt(0).toUpperCase() + channel.name.slice(1)} Channel`,
        configuration: {},
      });
    }
  }, [channel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;

    onSubmit({
      type: channel.type,
      name: formData.name,
      configuration: formData.configuration,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      configuration: {},
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect to {channel.name} Channel</DialogTitle>
          <DialogDescription>
            Configure and connect to the {channel.description.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                placeholder="My Email Channel"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this channel
              </p>
            </div>

            {/* Channel-specific configuration fields */}
            {channel.type.toLowerCase() === 'email' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="host">SMTP Host</Label>
                  <Input
                    id="host"
                    placeholder="smtp.gmail.com"
                    value={formData.configuration.host || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          host: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="port">SMTP Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="587"
                    value={formData.configuration.port || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          port: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="from">From Email</Label>
                  <Input
                    id="from"
                    type="email"
                    placeholder="noreply@example.com"
                    value={formData.configuration.from || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          from: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}

            {channel.type.toLowerCase() === 'sms' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Your SMS provider API key"
                    value={formData.configuration.apiKey || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          apiKey: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fromNumber">From Number</Label>
                  <Input
                    id="fromNumber"
                    placeholder="+1234567890"
                    value={formData.configuration.fromNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          fromNumber: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}

            {channel.type.toLowerCase() === 'push' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="serverKey">FCM Server Key</Label>
                  <Input
                    id="serverKey"
                    type="password"
                    placeholder="Your Firebase Cloud Messaging server key"
                    value={formData.configuration.serverKey || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          serverKey: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
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
              {isLoading ? 'Connecting...' : 'Connect Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
