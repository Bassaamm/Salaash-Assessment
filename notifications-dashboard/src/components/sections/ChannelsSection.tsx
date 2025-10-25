import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi, type AvailableChannel } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Bell, CheckCircle2, XCircle, Plug } from 'lucide-react';
import { ConnectChannelDialog } from '../dialogs/ConnectChannelDialog';

export function ChannelsSection() {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<AvailableChannel | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const { data: availableChannels, isLoading: loadingAvailable } = useQuery({
    queryKey: ['channels', 'available'],
    queryFn: () => channelsApi.getAvailable().then((res) => res.data),
  });

  const { data: connectedChannels, isLoading: loadingConnected } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll().then((res) => res.data),
  });

  const connectMutation = useMutation({
    mutationFn: channelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowConnectDialog(false);
      setSelectedChannel(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      channelsApi.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'push':
        return <Bell className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const isChannelAvailable = (type: string) => {
    // All channels are available (EMAIL sends real emails, SMS/PUSH are mocked)
    return true;
  };

  const isChannelConnected = (type: string) => {
    return connectedChannels?.some((channel) => channel.type.toLowerCase() === type.toLowerCase());
  };

  const handleConnectClick = (channel: AvailableChannel) => {
    setSelectedChannel(channel);
    setShowConnectDialog(true);
  };

  return (
    <div className="space-y-8">
      {/* Available Channels Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Available Channels</h2>
            <p className="text-sm text-muted-foreground">
              Connect to notification channels to start sending messages
            </p>
          </div>
        </div>

        {loadingAvailable ? (
          <div className="text-center py-8">Loading available channels...</div>
        ) : availableChannels && availableChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableChannels.map((channel) => {
              const connected = isChannelConnected(channel.type);
              const available = isChannelAvailable(channel.type);
              return (
                <Card key={channel.type} className={`relative ${!available ? 'opacity-75' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          connected
                            ? 'bg-green-100 text-green-600'
                            : available
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {getChannelIcon(channel.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg capitalize">
                              {channel.name}
                            </CardTitle>
                            {!available && (
                              <Badge variant="outline" className="text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{channel.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {connected ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 w-full justify-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : available ? (
                        <Button
                          onClick={() => handleConnectClick(channel)}
                          className="w-full"
                          size="sm"
                        >
                          <Plug className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          size="sm"
                          disabled
                          variant="secondary"
                        >
                          Unavailable
                        </Button>
                      )}
                      {channel.type.toLowerCase() !== 'email' && (
                        <p className="text-xs text-muted-foreground text-center">
                          SMS and Push notifications are logged (mock mode)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              No available channels
            </div>
          </Card>
        )}
      </div>

      {/* Connected Channels Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Connected Channels</h2>
            <p className="text-sm text-muted-foreground">
              Manage your active notification channels
            </p>
          </div>
        </div>

        {loadingConnected ? (
          <div className="text-center py-8">Loading connected channels...</div>
        ) : connectedChannels && connectedChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedChannels.map((channel) => (
              <Card key={channel.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        channel.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getChannelIcon(channel.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {channel.type}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: channel.id,
                          isActive: !channel.isActive,
                        })
                      }
                      disabled={toggleActiveMutation.isPending}
                    >
                      {channel.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="mb-3">
                      {channel.isActive ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Created:</span>{' '}
                      <span className="font-medium">
                        {new Date(channel.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>{' '}
                      <span className="font-medium">
                        {new Date(channel.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {channel.configuration && Object.keys(channel.configuration).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground mb-1">Configuration:</div>
                        <div className="text-xs space-y-1">
                          {Object.entries(channel.configuration).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-mono">
                                {String(value).length > 20
                                  ? `${String(value).substring(0, 20)}...`
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              No connected channels yet. Connect to a channel above to get started.
            </div>
          </Card>
        )}
      </div>

      {/* Connect Channel Dialog */}
      <ConnectChannelDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        channel={selectedChannel}
        onSubmit={(data) => connectMutation.mutate(data)}
        isLoading={connectMutation.isPending}
      />
    </div>
  );
}
