import { HarnessLoader } from '@angular/cdk/testing';
import { TnButtonToggleHarness } from '@truenas/ui-components';
import { escapeRegExp } from 'lodash-es';
import { MockComponent } from 'ng-mocks';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';

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

/**
 * Spectator `overrideComponents` entry that stubs the explorer's "Create Zvol" button.
 *
 * `BaseNamespaceFormComponent` is standalone, so its own `imports` define its template scope — a
 * mock listed in the TestBed module would NOT replace the real child, and the real button would
 * render (pulling in the real `FormSidePanelService`) while the spec read as though it were
 * stubbed. Overriding the component's own import array is what actually swaps it.
 */
export function mockExplorerCreateZvol(): [typeof BaseNamespaceFormComponent, {
  remove: { imports: [typeof ExplorerCreateZvolComponent] };
  add: { imports: [unknown] };
}] {
  return [BaseNamespaceFormComponent, {
    remove: { imports: [ExplorerCreateZvolComponent] },
    add: { imports: [MockComponent(ExplorerCreateZvolComponent)] },
  }];
}
