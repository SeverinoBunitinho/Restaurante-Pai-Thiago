export const closedOrderStatuses = ["delivered", "cancelled"];
export const closedReservationStatuses = ["completed", "cancelled"];
export const emergencyCleanupConfirmationText = "LIMPEZA EXTREMA";

export function normalizeEmergencyCleanupRetentionDays(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isInteger(parsed)) {
    return 30;
  }

  return Math.min(Math.max(parsed, 1), 3650);
}

export function buildEmergencyCleanupCutoffIso(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  return cutoffDate.toISOString();
}
