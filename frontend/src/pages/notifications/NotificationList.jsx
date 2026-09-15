import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../../api/errors.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications.js";

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</h1>
        <button onClick={handleMarkAllRead} disabled={isMarkingAll || unreadCount === 0}>
          {isMarkingAll ? "Marking…" : "Mark all as read"}
        </button>
      </div>

      <div style={{ margin: "1rem 0" }}>
        <label>
          <input type="checkbox" checked={unreadOnly} onChange={handleUnreadOnlyChange} /> Unread only
        </label>
      </div>

      {isLoading && <p>Loading notifications…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && notifications.length === 0 && (
        <p>{unreadOnly ? "No unread notifications." : "No notifications yet."}</p>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <>
          <ul style={{ listStyle: "none", padding: 0, maxWidth: 640 }}>
            {notifications.map((notification) => {
              const link = relatedLink(notification);
              return (
                <li
                  key={notification.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    background: notification.is_read ? "transparent" : "#f0f6ff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      {link ? (
                        <Link to={link} onClick={() => !notification.is_read && handleMarkRead(notification.id)}>
                          <strong>{notification.title}</strong>
                        </Link>
                      ) : (
                        <strong>{notification.title}</strong>
                      )}
                      <p style={{ margin: "0.25rem 0" }}>{notification.message}</p>
                      <span style={{ color: "#52514e", fontSize: "0.85rem" }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    {!notification.is_read && (
                      <button onClick={() => handleMarkRead(notification.id)}>Mark as read</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
