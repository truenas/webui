import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  AclEditorSaveControlsComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/acl-editor-save-controls/acl-editor-save-controls.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';

describe('AclEditorSaveControlsComponent', () => {
  let spectator: Spectator<AclEditorSaveControlsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AclEditorSaveControlsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DatasetAclEditorStore, {
        saveAcl: jest.fn(),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        canBeSaved: true,
        ownerValues: {
          owner: 'root',
          ownerGroup: 'wheel',
          applyOwner: true,
          applyGroup: false,
        },
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('marks save button as disabled when [canBeSaved] is false', async () => {
    spectator.setInput('canBeSaved', false);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save Access Control List' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('shows a warning when Recursive is selected', async () => {
    const recursiveCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursiveCheckbox.check();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptextAcl.recursiveDialogTitle,
      message: helptextAcl.recursiveDialogMessage,
    });
  });

  it('shows Traverse checkbox when Recursive is selected', async () => {
    const recursiveCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursiveCheckbox.check();

    const traverseCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions to child datasets' }));
    expect(traverseCheckbox).toBeTruthy();
  });


  it('saves current ACL settings with validation always enabled when save button is pressed', async () => {
    const recursiveCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursiveCheckbox.check();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save Access Control List' }));
    await saveButton.click();

    expect(spectator.inject(DatasetAclEditorStore).saveAcl).toHaveBeenCalledWith({
      recursive: true,
      traverse: false,
      owner: 'root',
      ownerGroup: 'wheel',
      applyOwner: true,
      applyGroup: false,
    });
  });
});
