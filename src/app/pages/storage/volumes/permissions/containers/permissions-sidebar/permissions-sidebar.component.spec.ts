import { fakeAsync } from '@angular/core/testing';
import {
  byTitle, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { Acl, NfsAcl, PosixAcl } from 'app/interfaces/acl.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { NfsPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-nfs-permissions/nfs-permissions.component';
import { PosixPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-posix-permissions/posix-permissions.component';
import { TrivialPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-trivial-permissions/trivial-permissions.component';
import { PermissionsSidebarComponent } from 'app/pages/storage/volumes/permissions/containers/permissions-sidebar/permissions-sidebar.component';
import { PermissionsSidebarStore } from 'app/pages/storage/volumes/permissions/stores/permissions-sidebar.store';
import { DialogService, WebSocketService } from 'app/services';

describe('PermissionsSidebarComponent', () => {
  const stat = {
    user: 'john',
    group: 'johns',
    mode: 16889,
  } as FileSystemStat;

  const dataset = {
    id: 'dataset',
    mountpoint: '/mnt/testpool/dataset',
    pool: 'testpool',
  } as Dataset;

  let spectator: Spectator<PermissionsSidebarComponent>;
  const createComponent = createComponentFactory({
    component: PermissionsSidebarComponent,
    declarations: [
      MockComponent(PosixPermissionsComponent),
      MockComponent(NfsPermissionsComponent),
      MockComponent(TrivialPermissionsComponent),
    ],
    providers: [
      PermissionsSidebarStore,
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('filesystem.stat', stat),
        mockCall('filesystem.getacl', {
          trivial: true,
        } as Acl),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { dataset },
    });
  });

  it('loads stat and acl for dataset provided in Input', () => {
    const websocket = spectator.inject(WebSocketService);

    expect(websocket.call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/testpool/dataset']);
    expect(websocket.call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/testpool/dataset', false, true]);
  });

  it('shows dataset ownership information', () => {
    expect(spectator.query('.item-owner')).toHaveText('Owner:john');
    expect(spectator.query('.item-group')).toHaveText('Group:johns');
    expect(spectator.query('.item-path')).toHaveText('Path:/mnt/testpool/dataset');
  });

  it('shows trivial permissions when acl is trivial', () => {
    const permissionsComponent = spectator.query(TrivialPermissionsComponent);
    expect(permissionsComponent).toExist();
    expect(permissionsComponent.stat).toBe(stat);
  });

  it('shows posix permissions when acltype is POSIX', () => {
    const acl = {
      trivial: false,
      acltype: AclType.Posix1e,
    } as PosixAcl;

    spectator.inject(MockWebsocketService).mockCallOnce('filesystem.getacl', acl);

    spectator.setInput('dataset', {
      ...dataset,
      mountpoint: '/mnt/test/posix',
    });

    const permissionsComponent = spectator.query(PosixPermissionsComponent);
    expect(permissionsComponent).toExist();
    expect(permissionsComponent.acl).toBe(acl);

    expect(spectator.query(byTitle('Edit permissions')))
      .toHaveAttribute('href', '/storage/id/testpool/dataset/posix-acl/dataset');
  });

  it('shows nfs permissions when acltype is NFS', fakeAsync(() => {
    const acl = {
      trivial: false,
      acltype: AclType.Nfs4,
    } as NfsAcl;

    spectator.inject(MockWebsocketService).mockCallOnce('filesystem.getacl', acl);

    spectator.setInput('dataset', {
      ...dataset,
      mountpoint: '/mnt/test/nfs',
    });
    spectator.tick();
    spectator.detectChanges();

    const permissionsComponent = spectator.query(NfsPermissionsComponent);
    expect(permissionsComponent).toExist();
    expect(permissionsComponent.acl).toBe(acl);

    expect(spectator.query(byTitle('Edit permissions')))
      .toHaveAttribute('href', '/storage/id/testpool/dataset/acl/dataset');
  }));

  it('does not show edit icon when dataset is root', () => {
    spectator.setInput('dataset', {
      ...dataset,
      mountpoint: '/mnt/root',
    } as Dataset);

    expect(spectator.query(byTitle('Edit permissions'))).not.toExist();
  });
});
