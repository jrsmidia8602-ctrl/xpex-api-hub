import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { withRetry } from "@/lib/retry";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  action_url?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setIsRetrying(true);
      const { data, error } = await withRetry(
        async () => {
          const result = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);
          if (result.error) throw result.error;
          return result;
        },
        { maxRetries: 3, initialDelay: 1000 }
      );

      const typedData = (data || []) as Notification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId);
        if (error) throw error;
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user.id)
          .eq("read", false);
        if (error) throw error;
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId);
        if (error) throw error;
      });

      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAll = async () => {
    if (!user) return;

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("user_id", user.id);
        if (error) throw error;
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    isRetrying,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  };
};
