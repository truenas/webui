import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  createRoutingFactory, mockProvider, SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag, NfsAclType, NfsBasicPermission } from 'app/enums/nfs-acl.enum';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { NfsAcl, PosixAcl, PosixAclItem } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
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
import { SaveAsPresetModalComponent } from 'app/pages/datasets/modules/permissions/components/save-as-preset-modal/save-as-preset-modal.component';
import {
  SelectPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/select-preset-modal/select-preset-modal.component';
import {
  StripAclModalComponent,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';
import {
  AclEditorSaveControlsComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/acl-editor-save-controls/acl-editor-save-controls.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';

describe('DatasetAclEditorComponent', () => {
  let spectator: SpectatorRouting<DatasetAclEditorComponent>;
  let api: MockApiService;
  let matDialog: MatDialog;
  let loader: HarnessLoader;
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
      CastPipe,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(EditPosixAceComponent),
      MockComponent(EditNfsAceComponent),
      MockComponent(AclEditorSaveControlsComponent),
      AclEditorListComponent,
      PermissionsItemComponent,
    ],
    providers: [
      StorageService,
      DatasetAclEditorStore,
      mockProvider(DialogService),
      mockApi([
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockAuth(),
    ],
    queryParams: {
      path: '/mnt/pool/dataset',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(MockApiService);
    matDialog = spectator.inject(MatDialog);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('preset modal', () => {
    it('shows select preset modal if user presses "Use Preset"', async () => {
      const usePresetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Use Preset' }));
      await usePresetButton.click();

      expect(matDialog.open).toHaveBeenCalledWith(
        SelectPresetModalComponent,
        { data: { allowCustom: false, datasetPath: '/mnt/pool/dataset' } },
      );
    });

    it('shows save as preset modal if user presses "Save As Preset"', async () => {
      const saveAsPresetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save As Preset' }));
      await saveAsPresetButton.click();

      expect(matDialog.open).toHaveBeenCalledWith(
        SaveAsPresetModalComponent,
        { data: { aclType: AclType.Nfs4, datasetPath: '/mnt/pool/dataset' } },
      );
    });
  });

  describe('loading and layout', () => {
    it('loads acl and stats for the dataset specified', () => {
      expect(api.call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/pool/dataset', true, true]);
      expect(api.call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/pool/dataset']);
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
      const form = spectator.query(EditNfsAceComponent)!;

      expect(form).toExist();
      expect(form.ace).toBe(acl.acl[0]);
    });
  });

  describe('editing', () => {
    it('opens Strip ACL dialog when Strip Acl is pressed', async () => {
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
    it('renders save controls', () => {
      expect(spectator.query(AclEditorSaveControlsComponent)).toExist();
    });
  });
});

describe('DatasetAclEditorComponent - POSIX1E Features', () => {
  let spectator: SpectatorRouting<DatasetAclEditorComponent>;
  let loader: HarnessLoader;

  const createPosixAce = (tag: PosixAclTag, isDefault = false): PosixAclItem => ({
    tag,
    default: isDefault,
    perms: {
      [PosixPermission.Read]: true,
      [PosixPermission.Write]: false,
      [PosixPermission.Execute]: false,
    },
    id: null,
    who: tag === PosixAclTag.User ? 'testuser' : undefined,
  });

  const posixAcl: PosixAcl = {
    acltype: AclType.Posix1e,
    trivial: false,
    flags: { setuid: false, setgid: false, sticky: false },
    uid: 0,
    gid: 0,
    acl: [
      createPosixAce(PosixAclTag.UserObject, false),
      createPosixAce(PosixAclTag.GroupObject, false),
      createPosixAce(PosixAclTag.Other, false),
      createPosixAce(PosixAclTag.User, false),
    ],
  };

  const createComponent = createRoutingFactory({
    component: DatasetAclEditorComponent,
    imports: [
      CastPipe,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(EditPosixAceComponent),
      MockComponent(EditNfsAceComponent),
      MockComponent(AclEditorSaveControlsComponent),
      AclEditorListComponent,
      PermissionsItemComponent,
    ],
    providers: [
      StorageService,
      DatasetAclEditorStore,
      mockProvider(DialogService),
      mockApi([
        mockCall('filesystem.getacl', posixAcl),
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockAuth(),
    ],
    queryParams: {
      path: '/mnt/pool/dataset',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('Copy Access to Default functionality', () => {
    it('should show "Copy Access to Default" button for POSIX ACLs with access entries', async () => {
      const copyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Copy Access to Default' }));
      expect(copyButton).toBeTruthy();
    });

    it('should call store.copyAccessToDefault when button is clicked', async () => {
      const store = spectator.inject(DatasetAclEditorStore);
      const copyAccessToDefaultSpy = jest.spyOn(store, 'copyAccessToDefault');

      const copyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Copy Access to Default' }));
      await copyButton.click();

      expect(copyAccessToDefaultSpy).toHaveBeenCalled();
    });

    it('should disable button when no access entries exist', () => {
      const component = spectator.component;
      expect(component.hasAccessEntries()).toBe(true);

      // Test the method directly
      component.acl = {
        ...posixAcl,
        acl: [createPosixAce(PosixAclTag.UserObject, true)], // Only default entries
      };
      expect(component.hasAccessEntries()).toBe(false);
    });
  });

  describe('Ensure MASK Entries functionality', () => {
    it('should show "Add Missing MASK Entries" button for POSIX ACLs', async () => {
      const maskButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Missing MASK Entries' }));
      expect(maskButton).toBeTruthy();
    });

    it('should call store.ensureMaskEntries when button is clicked', async () => {
      const store = spectator.inject(DatasetAclEditorStore);
      const ensureMaskEntriesSpy = jest.spyOn(store, 'ensureMaskEntries');

      const maskButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Missing MASK Entries' }));
      await maskButton.click();

      expect(ensureMaskEntriesSpy).toHaveBeenCalled();
    });

    it('should correctly identify when MASK entries are needed', () => {
      const component = spectator.component;

      // Test with USER entries but no MASK
      component.acl = {
        ...posixAcl,
        acl: [
          createPosixAce(PosixAclTag.UserObject, false),
          createPosixAce(PosixAclTag.GroupObject, false),
          createPosixAce(PosixAclTag.Other, false),
          createPosixAce(PosixAclTag.User, false), // USER entry without MASK
        ],
      };
      expect(component.needsMaskEntries()).toBe(true);

      // Test with USER entries and MASK
      component.acl = {
        ...posixAcl,
        acl: [
          createPosixAce(PosixAclTag.UserObject, false),
          createPosixAce(PosixAclTag.GroupObject, false),
          createPosixAce(PosixAclTag.Other, false),
          createPosixAce(PosixAclTag.User, false),
          createPosixAce(PosixAclTag.Mask, false), // MASK exists
        ],
      };
      expect(component.needsMaskEntries()).toBe(false);

      // Test with no USER/GROUP entries
      component.acl = {
        ...posixAcl,
        acl: [
          createPosixAce(PosixAclTag.UserObject, false),
          createPosixAce(PosixAclTag.GroupObject, false),
          createPosixAce(PosixAclTag.Other, false),
        ],
      };
      expect(component.needsMaskEntries()).toBe(false);
    });
  });

  describe('POSIX helpers section', () => {
    it('should show POSIX ACL helpers section only for POSIX ACLs', () => {
      const helpersSection = spectator.query('.posix-helpers');
      expect(helpersSection).toExist();

      const helpersLabel = spectator.query('.helpers-label');
      expect(helpersLabel).toHaveText('POSIX ACL Helpers');
    });
  });
});
