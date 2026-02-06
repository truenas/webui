import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Group } from 'app/interfaces/group.interface';
import { directIdMapping, User } from 'app/interfaces/user.interface';
import { IxButtonGroupHarness } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';
import { MapUserGroupIdsDialogComponent } from './map-user-group-ids-dialog.component';
import { ViewType } from './mapping.types';

const mockUserService = {
  userQueryDsCache: jest.fn(() => of([])),
  groupQueryDsCache: jest.fn(() => of([])),
  getUserByNameCached: jest.fn(() => of(null)),
  getGroupByNameCached: jest.fn(() => of(null)),
};

describe('MapUserGroupIdsDialogComponent', () => {
  let spectator: Spectator<MapUserGroupIdsDialogComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const mockUsers: User[] = [
    {
      id: 1,
      uid: 1000,
      username: 'testuser',
      userns_idmap: directIdMapping,
      local: true,
    } as User,
    {
      id: 2,
      uid: 1001,
      username: 'anotheruser',
      userns_idmap: 2001,
      local: true,
    } as User,
  ];

  const mockGroups: Group[] = [
    {
      id: 10,
      gid: 1000,
      group: 'testgroup',
      userns_idmap: directIdMapping,
      local: true,
    } as Group,
    {
      id: 11,
      gid: 1001,
      group: 'anothergroup',
      userns_idmap: 2002,
      local: true,
    } as Group,
  ];

  const createComponent = createComponentFactory({
    component: MapUserGroupIdsDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('user.query', mockUsers),
        mockCall('group.query', mockGroups),
        mockCall('user.update'),
        mockCall('group.update'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(UserService, mockUserService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads users on init', () => {
    expect(api.call).toHaveBeenCalledWith('user.query', [[
      ['local', '=', true], ['userns_idmap', '!=', null],
    ]]);
  });

  it('displays users by default', () => {
    const rows = spectator.queryAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveText('testuser');
    expect(rows[0]).toHaveText('1000');
    expect(rows[0]).toHaveText('Same');
    expect(rows[1]).toHaveText('anotheruser');
    expect(rows[1]).toHaveText('1001');
    expect(rows[1]).toHaveText('2001');
  });

  it('switches to groups when type is changed', async () => {
    const buttonGroup = await loader.getHarness(IxButtonGroupHarness);
    await buttonGroup.setValue('Groups');

    expect(spectator.component.typeControl.value).toBe(ViewType.Groups);
  });

  it('deletes user mapping when delete button is clicked', () => {
    const apiCallSpy = jest.spyOn(api, 'call');
    apiCallSpy.mockClear();
    apiCallSpy.mockReturnValue(of(null));

    const deleteButtons = spectator.queryAll('td button[mat-icon-button]');
    expect(deleteButtons.length).toBeGreaterThan(0);

    deleteButtons[0].click();
    spectator.detectChanges();

    expect(apiCallSpy).toHaveBeenCalledWith('user.update', [1, { userns_idmap: null }]);
  });

  it('reloads mappings when a new mapping is added', () => {
    const apiCallSpy = jest.spyOn(api, 'call');
    apiCallSpy.mockClear();

    spectator.triggerEventHandler('ix-new-mapping-form', 'mappingAdded', undefined);
    spectator.detectChanges();

    expect(apiCallSpy).toHaveBeenCalledWith('user.query', [[
      ['local', '=', true], ['userns_idmap', '!=', null],
    ]]);
  });

  it('closes dialog when close button is clicked', () => {
    const dialogRef = spectator.inject(MatDialogRef);
    jest.spyOn(dialogRef, 'close');

    const closeButton = spectator.query('.header button[mat-icon-button]');
    closeButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
