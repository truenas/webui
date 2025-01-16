import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { AclTemplateByPath } from 'app/interfaces/acl.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SelectPresetModalConfig,
} from 'app/pages/datasets/modules/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { SelectPresetModalComponent } from './select-preset-modal.component';

describe('SelectPresetModalComponent', () => {
  const presets = [
    {
      name: 'POSIX_HOME',
      acltype: AclType.Posix1e,
      acl: [
        {
          tag: PosixAclTag.User,
          id: 2,
          who: 'john',
          default: false,
          perms: {
            [PosixPermission.Read]: true,
            [PosixPermission.Write]: true,
            [PosixPermission.Execute]: true,
          },
        },
      ],
    },
    {
      name: 'POSIX_OFFICE',
      acltype: AclType.Posix1e,
      acl: [],
    },
  ] as AclTemplateByPath[];
  let spectator: Spectator<SelectPresetModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SelectPresetModalComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DatasetAclEditorStore, {
        usePreset: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockApi([
        mockCall('filesystem.acltemplate.by_path', presets),
      ]),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            allowCustom: true,
            datasetPath: '/mnt/pool/dataset',
          } as SelectPresetModalConfig,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads acl presets for given path and shows them in the select', async () => {
    const api = spectator.inject(ApiService);
    const presetSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Preset' }));

    expect(api.call).toHaveBeenCalledWith('filesystem.acltemplate.by_path', [{
      'format-options': {
        resolve_names: true,
      },
      path: '/mnt/pool/dataset',
    }]);
    expect(await presetSelect.getOptionLabels()).toContain('POSIX_HOME');
    expect(await presetSelect.getOptionLabels()).toContain('POSIX_OFFICE');
  });

  it('hides the preset select when Create a custom ACL is selected', async () => {
    const actionsRadios = await loader.getHarness(IxRadioGroupHarness);
    await actionsRadios.setValue('Create a custom ACL');

    const presetSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Preset' }));

    expect(presetSelect).toBeNull();
  });

  it('closes dialog with no action if Create a custom ACL is selected and dialog submitted', async () => {
    const actionsRadios = await loader.getHarness(IxRadioGroupHarness);
    await actionsRadios.setValue('Create a custom ACL');

    const continueButton = await loader.getHarness(MatButtonHarness.with({ text: 'Continue' }));
    await continueButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(DatasetAclEditorStore).usePreset).not.toHaveBeenCalled();
  });

  it('calls `usePreset` on DatasetAclEditorStore when preset is selected and dialog is submitted', async () => {
    const actionsRadios = await loader.getHarness(IxRadioGroupHarness);
    await actionsRadios.setValue('Select a preset ACL');

    const presetSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Preset' }));
    await presetSelect.setValue('POSIX_HOME');

    const continueButton = await loader.getHarness(MatButtonHarness.with({ text: 'Continue' }));
    await continueButton.click();

    expect(spectator.inject(DatasetAclEditorStore).usePreset).toHaveBeenCalledWith(presets[0]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
