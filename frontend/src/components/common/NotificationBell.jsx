import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await notificationService.getNotifications({ limit: 1 });
        if (isMounted) {
          setUnreadCount(res?.unreadCount || 0);
        }
      } catch {
        // Silently fail if offline or not logged in
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30s background poll

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) return null;

  return (
    <Link
      to="/notifications"
      aria-label={`Notifications, ${unreadCount} unread`}
      title="Notifications"
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 bg-white/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-sm ${className}`}
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
