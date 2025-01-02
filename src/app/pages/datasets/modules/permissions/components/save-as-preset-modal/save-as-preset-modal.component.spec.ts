import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { Acl, AclTemplateByPath, PosixAclItem } from 'app/interfaces/acl.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { SaveAsPresetModalComponent } from 'app/pages/datasets/modules/permissions/components/save-as-preset-modal/save-as-preset-modal.component';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { UserService } from 'app/services/user.service';

describe('SaveAsPresetModalComponent', () => {
  let spectator: Spectator<SaveAsPresetModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SaveAsPresetModalComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      DatasetAclEditorStore,
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(UserService),
      mockApi([
        mockCall('filesystem.acltemplate.by_path', [
          {
            id: 1, name: 'e', acltype: AclType.Nfs4, acl: [],
          },
          {
            id: 2, name: 'd', acltype: AclType.Posix1e, acl: [],
          },
          {
            id: 3, name: 'c', acltype: AclType.Nfs4, acl: [],
          },
          {
            id: 4, name: 'a', acltype: AclType.Nfs4, acl: [],
          },
          {
            id: 5, name: 'b', acltype: AclType.Posix1e, acl: [] as PosixAclItem[],
          },
          {
            id: 6, name: 'f', acltype: AclType.Nfs4, acl: [],
          },
        ] as AclTemplateByPath[]),
        mockCall('filesystem.acltemplate.delete'),
        mockCall('filesystem.acltemplate.create'),
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
            aclType: AclType.Posix1e,
            datasetPath: '/mnt/pool/dataset',
          } as SaveAsPresetModalConfig,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads acl presets and shows them', () => {
    const api = spectator.inject(ApiService);

    expect(api.call).toHaveBeenCalledWith('filesystem.acltemplate.by_path', [{
      'format-options': {
        resolve_names: true,
      },
      path: '/mnt/pool/dataset',
    }]);

    const preset = spectator.queryAll('.preset');
    expect(preset).toHaveLength(6);

    expect(preset[0].querySelector('.preset-name')).toHaveText('b');
    expect(preset[0].querySelector('.preset-type')).toHaveText(AclType.Posix1e);
    expect(preset[1].querySelector('.preset-name')).toHaveText('d');
    expect(preset[1].querySelector('.preset-type')).toHaveText(AclType.Posix1e);
    expect(preset[2].querySelector('.preset-name')).toHaveText('a');
    expect(preset[2].querySelector('.preset-type')).toHaveText(AclType.Nfs4);
    expect(preset[3].querySelector('.preset-name')).toHaveText('c');
    expect(preset[3].querySelector('.preset-type')).toHaveText(AclType.Nfs4);
    expect(preset[4].querySelector('.preset-name')).toHaveText('e');
    expect(preset[4].querySelector('.preset-type')).toHaveText(AclType.Nfs4);
    expect(preset[5].querySelector('.preset-name')).toHaveText('f');
    expect(preset[5].querySelector('.preset-type')).toHaveText(AclType.Nfs4);
  });

  it('creates new preset after \'Save\' button click', async () => {
    jest.spyOn(spectator.component, 'loadIds').mockImplementation(() => of({ acl: [], acltype: AclType.Posix1e } as Acl));
    const actionsInput = await loader.getHarness(IxInputHarness);
    await actionsInput.setValue('New Preset');
    spectator.component.acl = { acl: [], acltype: AclType.Posix1e } as Acl;

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('filesystem.acltemplate.create', [{
      name: 'New Preset',
      acltype: 'POSIX1E',
      acl: [],
    }]);

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('removes a non-builtin preset when Remove icon is pressed', () => {
    const preset = spectator.queryAll('.preset');
    const removeButton = preset[2].querySelector('.preset-remove');
    spectator.click(removeButton);

    expect(removeButton).toHaveAttribute('aria-label', 'Remove preset');
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('filesystem.acltemplate.delete', [4]);
    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('filesystem.acltemplate.by_path', expect.anything());
  });
});
