import { HarnessLoader } from '@angular/cdk/testing';
import { SpectatorOptions } from '@ngneat/spectator';
import { TnButtonToggleHarness, FilePickerCreateAction, TnFilePickerHarness } from '@truenas/ui-components';
import { escapeRegExp } from 'lodash-es';
import { MockPipe } from 'ng-mocks';
import { CreateZvolActionPipe } from 'app/modules/forms/file-picker/create-zvol-action.pipe';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';

/**
 * Finds a namespace device-type toggle by label. A checked toggle's label gets a "✓" prefix, so the
 * pattern is anchored at the end; the `$` stops "File" matching "Existing File". The label is
 * regex-escaped first.
 */
export function getNamespaceTypeToggle(loader: HarnessLoader, label: string): Promise<TnButtonToggleHarness> {
  return loader.getHarness(TnButtonToggleHarness.with({ label: new RegExp(`${escapeRegExp(label)}$`) }));
}

/** Picks a device type on the namespace form's `tn-button-toggle-group`. */
export async function selectNamespaceType(loader: HarnessLoader, label: string): Promise<void> {
  const toggle = await getNamespaceTypeToggle(loader, label);
  await toggle.check();
}

/**
 * The namespace form's device path picker, whichever device type is selected — all three branches
 * bind it to `device_path`. Located by control rather than label: the label belongs to the wrapping
 * `tn-form-field`, which `IxFormHarness` indexes as a tn-* control it cannot drive.
 */
export function getNamespacePathPicker(loader: HarnessLoader): Promise<TnFilePickerHarness> {
  return loader.getHarness(TnFilePickerHarness.with({ selector: '[formControlName="device_path"]' }));
}

/** One entry of a spectator factory's `overrideComponents`. */
type ComponentOverride = NonNullable<SpectatorOptions<unknown>['overrideComponents']>[number];

/**
 * Spectator `overrideComponents` entry that stubs the zvol picker's "Create Zvol" action.
 *
 * `BaseNamespaceFormComponent` is standalone, so its own `imports` define its template scope — a
 * mock listed in the TestBed module would NOT replace the real pipe, and the real action would be
 * built (pulling in the real `FormSidePanelService`) while the spec read as though it were
 * stubbed. Overriding the component's own import array is what actually swaps it.
 */
export function mockCreateZvolAction(): ComponentOverride {
  const stubAction: FilePickerCreateAction = { id: 'create-zvol', label: 'Create Zvol' };
  return [BaseNamespaceFormComponent, {
    remove: { imports: [CreateZvolActionPipe] },
    add: { imports: [MockPipe(CreateZvolActionPipe, () => stubAction)] },
  }];
}
