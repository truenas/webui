import { HarnessLoader } from '@angular/cdk/testing';
import { TnButtonToggleHarness } from '@truenas/ui-components';

/**
 * Picks a device type on the namespace form's `tn-button-toggle-group`.
 *
 * A checked toggle's label text is prefixed with the tn-button-toggle "✓" marker, so the option
 * has to be matched loosely by regex rather than by exact string. Shared by every spec that
 * renders `BaseNamespaceFormComponent` so that workaround lives in one place if the library's
 * label format changes.
 */
export async function selectNamespaceType(loader: HarnessLoader, label: string): Promise<void> {
  const toggle = await loader.getHarness(TnButtonToggleHarness.with({ label: new RegExp(label) }));
  await toggle.check();
}
