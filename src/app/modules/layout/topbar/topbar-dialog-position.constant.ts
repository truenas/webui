import { GlobalPositionStrategy, Overlay } from '@angular/cdk/overlay';

/**
 * Top-right anchor (below the topbar) shared by every topbar popover/dialog.
 * Consumed directly by MatDialog-based popovers via `MatDialogConfig.position`
 * (e.g. ha-status-icon) and via `topbarDialogPositionStrategy()` by the
 * CDK/TnDialog-based ones. Keep both consumers reading these same offsets so the
 * anchor can't drift apart between dialog frameworks.
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
