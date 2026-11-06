import { TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';

/**
 * Middleware's specific reason for a failed registration, e.g. what TrueNAS Connect answered when it rejected
 * the finalize call. Returns null while `status_reason` still holds the generic per-status text.
 */
export function getTncRegistrationFailureDetail(
  config: { status: TruenasConnectStatus; status_reason: string | null } | null | undefined,
): string | null {
  if (config?.status !== TruenasConnectStatus.RegistrationFinalizationFailed) {
    return null;
  }

  const reason = config.status_reason?.trim();
  if (!reason || reason === TruenasConnectStatusReason[TruenasConnectStatus.RegistrationFinalizationFailed]) {
    return null;
  }
  return reason;
}
