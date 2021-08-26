import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { byButton } from 'app/core/testing/utils/by-button.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DefaultAclType } from 'app/enums/acl-type.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { SelectPresetModalComponent } from 'app/pages/storage/volumes/permissions/components/select-preset-modal/select-preset-modal.component';
import { SelectPresetModalConfig } from 'app/pages/storage/volumes/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { WebSocketService, DialogService } from 'app/services';
import { AppLoaderModule } from 'app/services/app-loader/app-loader.module';

describe('SelectPresetModalComponent', () => {
  let spectator: Spectator<SelectPresetModalComponent>;
  const createComponent = createComponentFactory({
    component: SelectPresetModalComponent,
    imports: [
      EntityModule,
      AppLoaderModule,
    ],
    providers: [
      mockProvider(DatasetAclEditorStore, {
        usePreset: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('filesystem.default_acl_choices', [
          DefaultAclType.PosixHome,
          DefaultAclType.PosixOpen,
          DefaultAclType.PosixRestricted,
        ]),
        mockCall('system.advanced.config', {} as AdvancedConfig),
      ]),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
    ],
  });

  it('loads acl options for for dataset provided in data', () => {
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

    const ws = spectator.inject(WebSocketService);
    expect(ws.call).toHaveBeenCalledWith('filesystem.default_acl_choices', ['/mnt/pool/dataset']);
  });

  it('shows an option to Create a custom ACL if param is passed in data', () => {
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
    spectator.click(spectator.query(byText('Create a custom ACL')));
    spectator.click(byButton('Continue'));

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
