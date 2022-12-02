import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SaveAsPresetModalComponent } from 'app/pages/datasets/modules/permissions/components/save-as-preset-modal/save-as-preset-modal.component';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import { DialogService, WebSocketService } from 'app/services';

describe('SaveAsPresetModalComponent', () => {
  let spectator: Spectator<SaveAsPresetModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SaveAsPresetModalComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('filesystem.acltemplate.by_path', [
          { name: 'e', acltype: AclType.Nfs4, acl: [] },
          { name: 'd', acltype: AclType.Posix1e, acl: [] },
          { name: 'c', acltype: AclType.Nfs4, acl: [] },
          { name: 'a', acltype: AclType.Nfs4, acl: [] },
          { name: 'b', acltype: AclType.Posix1e, acl: [] },
          { name: 'f', acltype: AclType.Nfs4, acl: [] },
        ]),
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
    const ws = spectator.inject(WebSocketService);

    expect(ws.call).toHaveBeenCalledWith('filesystem.acltemplate.by_path', [{
      'format-options': {
        ensure_builtins: true,
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
    const actionsInput = await loader.getHarness(IxInputHarness);
    await actionsInput.setValue('New Preset');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    // TODO: Check sending a request to save a new preset

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
