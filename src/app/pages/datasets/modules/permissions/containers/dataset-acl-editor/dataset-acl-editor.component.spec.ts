import {
  fakeAsync, flush, tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createRoutingFactory, mockProvider, SpectatorRouting, byText,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { byButton } from 'app/core/testing/utils/by-button.utils';
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
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { DialogService, StorageService, UserService } from 'app/services';

describe('DatasetAclEditorComponent', () => {
  let spectator: SpectatorRouting<DatasetAclEditorComponent>;
  let websocket: MockWebsocketService;
  let matDialog: MatDialog;
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
  });

  describe('preset modal', () => {
    beforeEach(() => {
      jest.spyOn(matDialog, 'open').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows preset modal if user presses "Use Preset"', () => {
      spectator.click(byButton('Use ACL Preset'));

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
    it('strips ACL when "Strip ACL" button is pressed', fakeAsync(() => {
      spectator.click(byButton('Strip ACL'));
      tick();

      spectator.click(spectator.query(
        byText('Remove the ACL and permissions from child datasets of the current dataset'),
        { root: true },
      ));

      spectator.click(spectator.query(
        byButton('Strip ACLs'),
        { root: true },
      ));

      expect(websocket.job).toHaveBeenCalledWith('filesystem.setacl', [{
        dacl: [],
        options: {
          recursive: true,
          stripacl: true,
          traverse: true,
        },
        path: '/mnt/pool/dataset',
      }]);
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets']);
      flush();
    }));

    it('adds another ace when Add item is pressed', () => {
      spectator.click(byButton('Add Item'));

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

    it('saves acl items when Save Access Control List is pressed', () => {
      spectator.click(byButton('Save Access Control List'));

      expect(store.saveAcl).toHaveBeenCalledWith({
        recursive: false,
        traverse: false,
        owner: 'john',
        ownerGroup: 'johns',
      });
    });

    // TODO: Doesn't work because of entryComponents. Try again after upgrading Angular.
    xit('shows a warning when `recursive` checkbox is pressed', fakeAsync(() => {
      spectator.click(byText('Apply permissions recursively'));
      tick();

      expect(spectator.query('.mat-dialog-container', { root: true })).toExist();

      spectator.click(spectator.query(
        byText('Confirm'),
        { root: true },
      ));

      spectator.click(spectator.query(byButton('Continue'), { root: true }));

      spectator.click(byButton('Save Access Control List'));

      expect(store.saveAcl).toHaveBeenCalledWith(234);
    }));
  });
});
