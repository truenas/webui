import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  createRoutingFactory, mockProvider, SpectatorRouting, byText,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag, NfsAclType, NfsBasicPermission } from 'app/enums/nfs-acl.enum';
import { NfsAcl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  AclEditorListComponent,
} from 'app/pages/datasets/modules/permissions/components/acl-editor-list/acl-editor-list.component';
import {
  EditNfsAceComponent,
} from 'app/pages/datasets/modules/permissions/components/edit-nfs-ace/edit-nfs-ace.component';
import {
  EditPosixAceComponent,
} from 'app/pages/datasets/modules/permissions/components/edit-posix-ace/edit-posix-ace.component';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  SelectPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/select-preset-modal/select-preset-modal.component';
import {
  StripAclModalComponent,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { DialogService, StorageService, UserService } from 'app/services';

describe('DatasetAclEditorComponent', () => {
  let spectator: SpectatorRouting<DatasetAclEditorComponent>;
  let websocket: MockWebsocketService;
  let matDialog: MatDialog;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  const acl = {
    acltype: AclType.Nfs4,
    trivial: false,
    acl: [
      {
        who: 'john',
        tag: NfsAclTag.User,
        type: NfsAclType.Allow,
        perms: {
          BASIC: NfsBasicPermission.Modify,
        },
      },
      {
        tag: NfsAclTag.Owner,
        type: NfsAclType.Allow,
        perms: {
          BASIC: NfsBasicPermission.Read,
        },
      },
      {
        tag: NfsAclTag.Everyone,
        type: NfsAclType.Deny,
        perms: {
          BASIC: NfsBasicPermission.Read,
        },
      },
    ],
  } as NfsAcl;

  const createComponent = createRoutingFactory({
    component: DatasetAclEditorComponent,
    imports: [
      EntityModule,
      IxFormsModule,
      CoreComponents,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(EditPosixAceComponent),
      MockComponent(EditNfsAceComponent),
      AclEditorListComponent,
      PermissionsItemComponent,
    ],
    providers: [
      StorageService,
      DatasetAclEditorStore,
      DialogService,
      mockWebsocket([
        mockCall('filesystem.getacl', acl),
        mockCall('filesystem.stat', {
          user: 'john',
          group: 'johns',
        } as FileSystemStat),
        mockJob('filesystem.setacl', fakeSuccessfulJob()),
      ]),
      mockProvider(UserService, {
        userQueryDsCache: () => of(),
        groupQueryDsCache: () => of(),
      }),
    ],
    params: {
      datasetId: 'pool/dataset',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    websocket = spectator.inject(MockWebsocketService);
    matDialog = spectator.inject(MatDialog);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  });

  describe('preset modal', () => {
    beforeEach(() => {
      jest.spyOn(matDialog, 'open').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows preset modal if user presses "Use Preset"', async () => {
      const usePresetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Use ACL Preset' }));
      await usePresetButton.click();

      expect(matDialog.open).toHaveBeenCalledWith(
        SelectPresetModalComponent,
        { data: { allowCustom: false, datasetPath: '/mnt/pool/dataset' } },
      );
    });
  });

  describe('loading and layout', () => {
    it('loads acl and stats for the dataset specified', () => {
      expect(websocket.call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/pool/dataset', true, true]);
      expect(websocket.call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/pool/dataset']);
    });

    it('shows loaded acl', () => {
      const items = spectator.queryAll('ix-permissions-item');
      expect(items).toHaveLength(3);

      expect(items[0]).toHaveText('User - john');
      expect(items[0]).toHaveText('Allow | Modify');
      expect(items[1]).toHaveText('owner@ - john');
      expect(items[1]).toHaveText('Allow | Read');
      expect(items[2]).toHaveText('everyone@');
      expect(items[2]).toHaveText('Deny | Read');
    });

    it('shows form for appropriate ace selected', () => {
      const form = spectator.query(EditNfsAceComponent);

      expect(form).toExist();
      expect(form.ace).toBe(acl.acl[0]);
    });
  });

  describe('editing', () => {
    it('opens Strip ACL dialog when Strip Acl is pressed', async () => {
      jest.spyOn(matDialog, 'open').mockImplementation();
      const stripButton = await loader.getHarness(MatButtonHarness.with({ text: 'Strip ACL' }));
      await stripButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StripAclModalComponent, {
        data: { path: '/mnt/pool/dataset' },
      });
    });

    it('adds another ace when Add item is pressed', async () => {
      const addAceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Item' }));
      await addAceButton.click();

      const items = spectator.queryAll('ix-permissions-item');
      expect(items).toHaveLength(4);
      expect(items[3]).toHaveText('User - ?');
      expect(items[3]).toHaveText('Allow | Modify');
    });
  });

  describe('saving', () => {
    let store: DatasetAclEditorStore;

    beforeEach(() => {
      store = spectator.inject(DatasetAclEditorStore);
      jest.spyOn(store, 'saveAcl').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('saves acl items when Save Access Control List is pressed', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Access Control List' }));
      await saveButton.click();

      expect(store.saveAcl).toHaveBeenCalledWith({
        recursive: false,
        traverse: false,
        applyGroup: false,
        applyOwner: false,
        owner: 'john',
        ownerGroup: 'johns',
      });
    });

    // TODO: Doesn't work because of entryComponents. Try again after upgrading Angular.
    xit('shows a warning when `recursive` checkbox is pressed', async () => {
      spectator.click(byText('Apply permissions recursively'));

      expect(spectator.query('.mat-dialog-container', { root: true })).toExist();

      spectator.click(spectator.query(
        byText('Confirm'),
        { root: true },
      ));

      const continueButton = await rootLoader.getHarness(MatButtonHarness.with({ text: 'Continue' }));
      await continueButton.click();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Access Control List' }));
      await saveButton.click();

      expect(store.saveAcl).toHaveBeenCalledWith(234);
    });
  });
});
