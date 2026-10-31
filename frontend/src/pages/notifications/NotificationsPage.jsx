import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  FileText,
  Activity,
  Trash2,
  CheckCircle,
  ExternalLink,
  Inbox,
  Clock,
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'clinical'
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (tab = activeTab) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await notificationService.getNotifications({ filter: tab, limit: 50 });
      setNotifications(res?.notifications || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsProcessing(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.isRead && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'triage_alert':
      case 'clinical_alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'report_published':
        return <FileText className="w-5 h-5 text-teal-500" />;
      case 'case_update':
        return <Activity className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTargetLink = (item) => {
    if (item.link) return item.link;
    if (item.caseId) {
      return user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN'
        ? `/professional/cases/${item.caseId}`
        : `/patient/cases/${item.caseId}`;
    }
    if (item.conversationId) {
      return `/patient/consultation`;
    }
    return null;
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time updates, consultation status, and clinical alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activeTab === 'unread'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activeTab === 'clinical'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Clinical Alerts
        </button>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No notifications
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'unread'
              ? "You're all caught up! No unread notifications found."
              : activeTab === 'clinical'
              ? 'No clinical alerts or critical case notifications at this time.'
              : 'You have no notifications yet. Important case updates and alerts will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const isUnread = !item.isRead && !item.read;
            const targetLink = getTargetLink(item);

            return (
              <div
                key={item.id}
                className={`relative group rounded-2xl border transition-all duration-200 p-5 ${
                  isUnread
                    ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-800/60 shadow-sm'
                    : 'bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex-shrink-0">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" title="Unread" />
                      )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(item.createdAt)}
                      </span>

                      {item.type && (
                        <span className="uppercase tracking-wider font-semibold text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                          {item.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {targetLink && (
                      <Link
                        to={targetLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/70 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
