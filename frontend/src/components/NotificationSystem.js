import React, { useState, useEffect } from 'react';
import { 
  WarningAmberOutlined, 
  WarningOutlined, 
  InfoOutlined, 
  NotificationsOutlined,
  Check,
  Close
} from '@mui/icons-material';

const NotificationSystem = ({ anomalies, onNotificationRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Process anomalies into notifications
  useEffect(() => {
    if (anomalies && anomalies.length > 0) {
      const newNotifications = anomalies
        .filter(anomaly => anomaly.severity === 'critical' || anomaly.severity === 'warning')
        .map(anomaly => ({
          id: anomaly.id,
          type: anomaly.severity,
          title: getNotificationTitle(anomaly),
          message: anomaly.message,
          timestamp: anomaly.timestamp,
          read: false,
          action: getNotificationAction(anomaly)
        }));

      // Add new notifications that don't already exist
      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const trulyNew = newNotifications.filter(n => !existingIds.includes(n.id));
        return [...trulyNew, ...prev];
      });

      // Update unread count
      setUnreadCount(prev => prev + newNotifications.length);
      
      // Show notification panel if there are critical alerts
      if (newNotifications.some(n => n.type === 'critical')) {
        setIsVisible(true);
      }
    }
  }, [anomalies]);

  const getNotificationTitle = (anomaly) => {
    switch (anomaly.type) {
      case 'budget_overrun':
        return 'Budget Overrun Alert';
      case 'unusual_spending':
        return 'Unusual Spending Detected';
      case 'rapid_spending':
        return 'Rapid Spending Alert';
      case 'weekend_spending':
        return 'Weekend Spending';
      case 'spending_pattern':
        return 'Spending Pattern Anomaly';
      default:
        return 'System Alert';
    }
  };

  const getNotificationAction = (anomaly) => {
    switch (anomaly.type) {
      case 'budget_overrun':
        return { text: 'View Budget', target: 'budget' };
      case 'unusual_spending':
        return { text: 'Review Transaction', target: 'transactions' };
      case 'rapid_spending':
        return { text: 'View Recent Transactions', target: 'transactions' };
      default:
        return { text: 'View Details', target: 'analytics' };
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    onNotificationRead?.(notificationId);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical': return <WarningAmberOutlined />;
      case 'warning': return <WarningOutlined />;
      case 'info': return <InfoOutlined />;
      default: return <NotificationsOutlined />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'critical': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="notification-system">
      {/* Notification Bell Icon */}
      <div className="notification-bell">
        <button 
          className="bell-btn"
          onClick={() => setIsVisible(!isVisible)}
        >
          <NotificationsOutlined />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {isVisible && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            <div className="panel-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </button>
              )}
              <button 
                className="close-panel-btn"
                onClick={() => setIsVisible(false)}
              >
                <Close />
              </button>
            </div>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <span 
                        className="notification-icon"
                        style={{ color: getNotificationColor(notification.type) }}
                      >
                        {getNotificationIcon(notification.type)}
                      </span>
                      <span className="notification-title">{notification.title}</span>
                      <span className="notification-time">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    {notification.action && (
                      <div className="notification-action">
                        <button 
                          className="action-btn"
                          onClick={() => {
                            // This would navigate to the appropriate tab/section
                            console.log(`Navigate to ${notification.action.target}`);
                            markAsRead(notification.id);
                          }}
                        >
                          {notification.action.text}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check />
                      </button>
                    )}
                    <button 
                      className="dismiss-btn"
                      onClick={() => dismissNotification(notification.id)}
                      title="Dismiss"
                    >
                      <Close />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications for Critical Alerts */}
      {notifications
        .filter(n => n.type === 'critical' && !n.read)
        .slice(0, 1) // Show only one toast at a time
        .map(notification => (
          <div key={`toast-${notification.id}`} className="toast-notification critical">
            <div className="toast-content">
              <span className="toast-icon"><WarningAmberOutlined /></span>
              <div className="toast-text">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
              <button 
                className="toast-close"
                onClick={() => markAsRead(notification.id)}
              >
                <Close />
              </button>
            </div>
          </div>
        ))
      }
    </div>
  );
};

export default NotificationSystem;
