import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../../api/errors.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications.js";
import { IconInbox } from "../../components/icons.jsx";
import { notificationIconFor } from "./notificationMeta.js";

const PAGE_SIZE = 20;

// FR-NOTIF-02: view all notifications, mark individually or all as read,
// filter (unread only), see timestamps, and jump to the related record.
function relatedLink(notification) {
  if (notification.related_entity_type === "drone") {
    return `/drones/${notification.related_entity_id}`;
  }
  if (notification.related_entity_type === "prediction") {
    return `/predictions/${notification.related_entity_id}`;
  }
  if (notification.related_entity_type === "maintenance") {
    return `/maintenance/${notification.related_entity_id}`;
  }
  return null;
}

export default function NotificationList() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [offset, setOffset] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return listNotifications({ unreadOnly, limit: PAGE_SIZE, offset })
      .then((data) => {
        setNotifications(data.items);
        setTotal(data.total);
        setUnreadCount(data.unread_count);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load notifications.")))
      .finally(() => setIsLoading(false));
  }, [unreadOnly, offset]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function handleUnreadOnlyChange(event) {
    setOffset(0);
    setUnreadOnly(event.target.checked);
  }

  async function handleMarkRead(notificationId) {
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? updated : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(getErrorMessage(err, "Could not mark notification as read."));
    }
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await fetchNotifications();
    } catch (err) {
      setError(getErrorMessage(err, "Could not mark all notifications as read."));
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Notification Center</span>
          <h1>Notifications{unreadCount > 0 && ` (${unreadCount} unread)`}</h1>
          <p>Failure alerts, status changes, and maintenance reminders.</p>
        </div>
        <div className="dc-actions">
          <button className="dc-btn dc-btn-secondary" onClick={handleMarkAllRead} disabled={isMarkingAll || unreadCount === 0}>
            {isMarkingAll ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      </div>

      <label className="dc-checkbox-row" style={{ marginBottom: "1.25rem" }}>
        <input type="checkbox" checked={unreadOnly} onChange={handleUnreadOnlyChange} />
        Unread only
      </label>

      {isLoading && <div className="dc-skeleton" style={{ height: 220 }} />}
      {error && <p className="dc-error-text">{error}</p>}

      {!isLoading && !error && notifications.length === 0 && (
        <div className="dc-card dc-state">
          <div className="dc-state-icon">
            <IconInbox />
          </div>
          <h2 style={{ fontSize: "1.1rem" }}>{unreadOnly ? "No unread notifications" : "No notifications yet"}</h2>
          <p>You're all caught up.</p>
        </div>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <>
          <div style={{ maxWidth: 680 }}>
            {notifications.map((notification) => {
              const link = relatedLink(notification);
              const meta = notificationIconFor(notification.type);
              return (
                <div key={notification.id} className={`dc-notif${notification.is_read ? "" : " is-unread"}`}>
                  <span className="dc-notif-icon" style={{ background: meta.soft, color: meta.color }}>
                    <meta.Icon />
                  </span>
                  <div className="dc-notif-body">
                    <div className="dc-notif-top">
                      {link ? (
                        <Link
                          to={link}
                          className="dc-notif-title"
                          onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                        >
                          {notification.title}
                        </Link>
                      ) : (
                        <span className="dc-notif-title">{notification.title}</span>
                      )}
                      <span className="dc-notif-time">{new Date(notification.created_at).toLocaleString()}</span>
                    </div>
                    <p className="dc-notif-message">{notification.message}</p>
                    {!notification.is_read && (
                      <div className="dc-notif-actions">
                        <button className="dc-btn dc-btn-ghost dc-btn-sm" onClick={() => handleMarkRead(notification.id)}>
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="dc-btn dc-btn-secondary dc-btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <span className="dc-muted" style={{ fontSize: "0.85rem" }}>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button className="dc-btn dc-btn-secondary dc-btn-sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
