import { HarnessLoader } from '@angular/cdk/testing';
import { TnButtonToggleHarness } from '@truenas/ui-components';
import { escapeRegExp } from 'lodash-es';

/**
 * Finds one of the namespace form's device-type toggles.
 *
 * A checked toggle's label text is prefixed with the tn-button-toggle "✓" marker, so the option
 * has to be matched loosely by regex rather than by exact string. The label is escaped first —
 * device-type labels are plain today, but an unescaped `(`, `+` or `.` would silently broaden the
 * pattern or throw. Shared by every spec that renders `BaseNamespaceFormComponent` so the
 * workaround lives in one place if the library's label format changes.
 */
export function getNamespaceTypeToggle(loader: HarnessLoader, label: string): Promise<TnButtonToggleHarness> {
  return loader.getHarness(TnButtonToggleHarness.with({ label: new RegExp(escapeRegExp(label)) }));
}

/** Picks a device type on the namespace form's `tn-button-toggle-group`. */
export async function selectNamespaceType(loader: HarnessLoader, label: string): Promise<void> {
  const toggle = await getNamespaceTypeToggle(loader, label);
  await toggle.check();
}
