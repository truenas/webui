import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import {
  mockCall, mockJob, mockApi,
} from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetAclType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { DatasetTrivialPermissionsComponent } from './dataset-trivial-permissions.component';

describe('DatasetTrivialPermissionsComponent', () => {
  let spectator: Spectator<DatasetTrivialPermissionsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let api: ApiService;
  let saveButton: TnButtonHarness;
  const createComponent = createRoutingFactory({
    component: DatasetTrivialPermissionsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    params: {
      datasetId: 'pool/trivial',
    },
    providers: [
      mockApi([
        mockCall('pool.dataset.query', [{
          acltype: {
            value: DatasetAclType.Posix,
          },
        } as Dataset]),
        mockJob('filesystem.setperm'),
      ]),
      mockProvider(StorageService, {
        filesystemStat: jest.fn(() => of({
          mode: 16877,
          user: 'root',
          group: 'kmem',
        })),
      }),
      mockProvider(UserService, {
        groupQueryDsCache: () => of([
          { group: 'kmem' },
          { group: 'wheel' },
        ]),
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'games' },
        ]),
        getUserByName: (username: string) => of({ username } as { username: string }),
        getGroupByName: (groupName: string) => of({ group: groupName }),
        getUserByNameCached: (username: string) => of({ username } as { username: string }),
        getGroupByNameCached: (groupName: string) => of({ group: groupName }),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    api = spectator.inject(ApiService);
    saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
  });

  it('shows path of the dataset being edited', () => {
    const datasetPath = spectator.query('.dataset-path');

    expect(datasetPath).toHaveText('Dataset: /mnt/pool/trivial');
  });

  it('shows current setting owner and access information', async () => {
    const values = await form.getValues();

    expect(values).toEqual({
      User: 'root',
      Group: 'kmem',
    });

    const applyUser = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply User' }));
    const applyGroup = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply Group' }));
    const recursive = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions recursively' }));

    expect(await applyUser.isChecked()).toBe(false);
    expect(await applyGroup.isChecked()).toBe(false);
    expect(await recursive.isChecked()).toBe(false);

    // Access Mode '755' → owner rwx, group r-x, other r-x
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'User Write' }))).isChecked()).toBe(true);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Group Write' }))).isChecked()).toBe(false);
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Other Execute' }))).isChecked()).toBe(true);
  });

  it('saves new user and group when form is saved', async () => {
    await form.fillForm({
      User: 'games',
      Group: 'wheel',
    });

    const applyUser = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply User' }));
    const applyGroup = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply Group' }));
    await applyUser.check();
    await applyGroup.check();

    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('filesystem.setperm', [{
      path: '/mnt/pool/trivial',
      mode: '755',
      user: 'games',
      group: 'wheel',
      options: {
        recursive: false,
        stripacl: false,
        traverse: false,
      },
    }]);
  });

  it('saves permissions when they are saved', async () => {
    // '755' → '777': add write for group and other
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Group Write' }))).check();
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Other Write' }))).check();

    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('filesystem.setperm', [{
      path: '/mnt/pool/trivial',
      mode: '777',
      options: {
        recursive: false,
        stripacl: false,
        traverse: false,
      },
    }]);
  });

  it('shows a warning when Recursive checkbox is pressed', async () => {
    const recursive = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursive.check();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Warning',
      }),
    );
  });

  it('saves permissions recursively and with traverse when advanced checkboxes are checked', async () => {
    // '755' → '555': remove write for owner
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'User Write' }))).uncheck();

    const recursive = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions recursively' }));
    await recursive.check();

    const traverse = await loader.getHarness(TnCheckboxHarness.with({ label: 'Apply permissions to child datasets' }));
    await traverse.check();

    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('filesystem.setperm', [{
      path: '/mnt/pool/trivial',
      mode: '555',
      options: {
        recursive: true,
        stripacl: true,
        traverse: true,
      },
    }]);
  });

  it('goes to ACL editor when Set ACL is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const setAclButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set ACL' }));
    await setAclButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/datasets', 'acl', 'edit'], { queryParams: { path: '/mnt/pool/trivial' } });
  });
});
