import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import {
  byTitle, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { Acl, NfsAcl, PosixAcl } from 'app/interfaces/acl.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import {
  ViewNfsPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-nfs-permissions/view-nfs-permissions.component';
import {
  ViewPosixPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-posix-permissions/view-posix-permissions.component';
import {
  ViewTrivialPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-trivial-permissions/view-trivial-permissions.component';
import {
  PermissionsCardComponent,
} from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';
import { PermissionsCardStore } from 'app/pages/datasets/modules/permissions/stores/permissions-card.store';
import { ApiService } from 'app/services/api.service';

describe('PermissionsCardComponent', () => {
  const stat = {
    user: 'john',
    group: 'johns',
    mode: 16889,
  } as FileSystemStat;

  const dataset = {
    id: 'testpool/dataset',
    name: 'testpool/dataset',
    mountpoint: '/mnt/testpool/dataset',
    pool: 'testpool',
  } as DatasetDetails;

  let spectator: Spectator<PermissionsCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: PermissionsCardComponent,
    imports: [
      CastPipe,
    ],
    declarations: [
      MockComponent(ViewPosixPermissionsComponent),
      MockComponent(ViewNfsPermissionsComponent),
      MockComponent(ViewTrivialPermissionsComponent),
    ],
    providers: [
      mockAuth(),
      PermissionsCardStore,
      mockProvider(DialogService),
      mockProvider(Router),
      mockApi([
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads stat and acl for dataset provided in Input', () => {
    const websocket = spectator.inject(ApiService);

    expect(websocket.call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/testpool/dataset']);
    expect(websocket.call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/testpool/dataset', true, true]);
  });

  it('shows dataset ownership information', () => {
    const [ownerItem, groupItem] = spectator.queryAll('.details-item');

    expect(ownerItem.textContent.replace(/\s/g, '')).toBe('Owner:john');
    expect(groupItem.textContent.replace(/\s/g, '')).toBe('Group:johns');
  });

  it('shows trivial permissions when acl is trivial', () => {
    const permissionsComponent = spectator.query(ViewTrivialPermissionsComponent);
    expect(permissionsComponent).toExist();
    expect(permissionsComponent.stat).toBe(stat);
  });

  it('shows posix permissions when acltype is POSIX', () => {
    const acl = {
      trivial: false,
      acltype: AclType.Posix1e,
    } as PosixAcl;

    spectator.inject(MockApiService).mockCallOnce('filesystem.getacl', acl);

    spectator.setInput('dataset', {
      ...dataset,
      mountpoint: '/mnt/test/posix',
    });

    const permissionsComponent = spectator.query(ViewPosixPermissionsComponent);
    expect(permissionsComponent).toExist();
    expect(permissionsComponent.acl).toBe(acl);
  });

  it('shows nfs permissions when acltype is NFS', fakeAsync(() => {
    const acl = {
      trivial: false,
      acltype: AclType.Nfs4,
    } as NfsAcl;

    spectator.inject(MockApiService).mockCallOnce('filesystem.getacl', acl);

    spectator.setInput('dataset', {
      ...dataset,
      mountpoint: '/mnt/test/nfs',
    });
    spectator.tick();
    spectator.detectChanges();

    const permissionsComponent = spectator.query(ViewNfsPermissionsComponent);
    expect(permissionsComponent).toExist();
    expect(permissionsComponent.acl).toBe(acl);
  }));

  it('shows a button to edit permissions when dataset is not root', async () => {
    const editLink = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editLink.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets', 'testpool/dataset', 'permissions', 'edit']);
  });

  it('does not show edit icon when dataset is root', () => {
    spectator.setInput('dataset', {
      ...dataset,
      mountpoint: '/mnt/root',
    } as DatasetDetails);

    expect(spectator.query(byTitle('Edit permissions'))).not.toExist();
  });
});
