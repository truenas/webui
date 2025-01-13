import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AclEditorSaveControlsComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/acl-editor-save-controls/acl-editor-save-controls.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';

describe('AclEditorSaveControlsComponent', () => {
  let spectator: Spectator<AclEditorSaveControlsComponent>;
  let loader: HarnessLoader;
  const call$ = new BehaviorSubject({
    activedirectory: DirectoryServiceState.Disabled,
    ldap: DirectoryServiceState.Disabled,
  });
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
      mockProvider(ApiService, {
        call: jest.fn(() => call$),
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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Access Control List' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('shows a warning when Recursive is selected', async () => {
    const recursiveCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursiveCheckbox.setValue(true);

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: helptextAcl.dataset_acl_recursive_dialog_warning,
      message: helptextAcl.dataset_acl_recursive_dialog_warning_message,
    });
  });

  it('shows Traverse checkbox when Recursive is selected', async () => {
    const recursiveCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursiveCheckbox.setValue(true);

    const traverseCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Apply permissions to child datasets' }));
    expect(traverseCheckbox).toBeTruthy();
  });

  it('shows Validate Effective ACL checkbox that defaults to true when directory services are enabled', async () => {
    call$.next({
      activedirectory: DirectoryServiceState.Healthy,
      ldap: DirectoryServiceState.Disabled,
    });

    const validateAclCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Validate effective ACL' }));
    expect(validateAclCheckbox).toBeTruthy();
    expect(await validateAclCheckbox.getValue()).toBe(true);
  });

  it('saves current ACL settings when save button is pressed', async () => {
    const recursiveCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursiveCheckbox.setValue(true);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Access Control List' }));
    await saveButton.click();

    expect(spectator.inject(DatasetAclEditorStore).saveAcl).toHaveBeenCalledWith({
      recursive: true,
      traverse: false,
      validateEffectiveAcl: true,
      owner: 'root',
      ownerGroup: 'wheel',
      applyOwner: true,
      applyGroup: false,
    });
  });
});
