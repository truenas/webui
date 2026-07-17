import { GlobalPositionStrategy, Overlay } from '@angular/cdk/overlay';

/**
 * Top-right anchor (below the topbar) shared by every topbar popover/dialog,
 * consumed via `topbarDialogPositionStrategy()` by the TnDialog-based popovers
 * (e.g. ha-status-icon, jobs-indicator).
 */
export const topbarDialogPosition = {
  top: '48px',
  right: '16px',
};

/**
 * Builds the CDK overlay position strategy that anchors a TnDialog to the
 * top-right corner below the topbar, reusing `topbarDialogPosition`'s offsets.
 */
export function topbarDialogPositionStrategy(overlay: Overlay): GlobalPositionStrategy {
  return overlay.position().global().top(topbarDialogPosition.top).right(topbarDialogPosition.right);
}
