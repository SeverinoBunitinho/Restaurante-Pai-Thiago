const STORAGE_PREFIX = "pai-thiago:notification-read";

export const NOTIFICATION_READ_EVENT = "pai-thiago:notification-read-updated";

function getScope(staffSession) {
  return staffSession ? "staff" : "customer";
}

function getStorageKey(kind, staffSession) {
  return `${STORAGE_PREFIX}:${getScope(staffSession)}:${kind}`;
}

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function getReadTimestamp(kind, staffSession) {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(kind, staffSession));
    return toPositiveNumber(rawValue);
  } catch {
    return 0;
  }
}

export function markNotificationAsRead(kind, staffSession, latestAt) {
  if (typeof window === "undefined") {
    return 0;
  }

  const resolvedLatest = toPositiveNumber(latestAt);

  if (!resolvedLatest) {
    return 0;
  }

  const previousValue = getReadTimestamp(kind, staffSession);
  const nextValue = Math.max(previousValue, resolvedLatest);

  if (nextValue <= previousValue) {
    return previousValue;
  }

  try {
    window.localStorage.setItem(getStorageKey(kind, staffSession), String(nextValue));
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_READ_EVENT, {
        detail: {
          kind,
          staffSession: Boolean(staffSession),
          value: nextValue,
        },
      }),
    );
  } catch {}

  return nextValue;
}

export function getUnreadCount(count, kind, staffSession, latestAt) {
  const safeCount = toPositiveNumber(count);

  if (!safeCount) {
    return 0;
  }

  const resolvedLatest = toPositiveNumber(latestAt);

  if (!resolvedLatest) {
    return safeCount;
  }

  const readTimestamp = getReadTimestamp(kind, staffSession);
  return readTimestamp >= resolvedLatest ? 0 : safeCount;
}
