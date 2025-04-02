
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative", className)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-nuumi-pink text-[10px] flex items-center justify-center text-white font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-9 px-2 pt-2">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
              {unreadCount > 0 && <span className="ml-1 text-nuumi-pink">{unreadCount}</span>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start p-3 border-b border-border/30">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-3 flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start p-3 border-b border-border/30">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-3 flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : notifications.filter(n => !n.read).length > 0 ? (
                notifications
                  .filter(notification => !notification.read)
                  .map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  ))
              ) : (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  No unread notifications
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
