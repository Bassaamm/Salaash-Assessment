import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type QueryParams } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';
import { CreateNotificationDialog } from '../dialogs/CreateNotificationDialog';
import { toast } from 'sonner';

export function NotificationsSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const queryParams: QueryParams = {
    page,
    limit: 10,
    ...(search && { search }),
    ...(status !== 'all' && { status }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', queryParams],
    queryFn: () => notificationsApi.getAll(queryParams).then((res) => res.data),
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data: {
      recipientId: string;
      channelId: string;
      templateName: string;
      data: Record<string, any>;
      idempotencyKey?: string;
    }) => notificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setCreateDialogOpen(false);
      toast.success('Notification created', {
        description: 'The notification has been queued successfully.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to create notification', {
        description: error.response?.data?.message || 'An error occurred',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      sent: 'default',
      failed: 'destructive',
      processing: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notification Events</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retry Count</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {notification.recipientId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.channel?.type || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{notification.templateName}</TableCell>
                      <TableCell>{getStatusBadge(notification.status)}</TableCell>
                      <TableCell>{notification.retryCount}</TableCell>
                      <TableCell>
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {notification.sentAt
                          ? new Date(notification.sentAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {data.meta.itemsPerPage * (data.meta.currentPage - 1) + 1} to{' '}
                {Math.min(
                  data.meta.itemsPerPage * data.meta.currentPage,
                  data.meta.totalItems
                )}{' '}
                of {data.meta.totalItems} notifications
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!data.meta.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!data.meta.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No notifications found
          </div>
        )}
      </Card>

      <CreateNotificationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => createNotificationMutation.mutate(data)}
        isLoading={createNotificationMutation.isPending}
      />
    </div>
  );
}
