import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonToggleHarness, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { directIdMapping } from 'app/interfaces/user.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
  let api: TypedApiService;

  const mockUsers = [
    {
      id: 1,
      uid: 1000,
      username: 'testuser',
      userns_idmap: directIdMapping,
      local: true,
    } as WebUiQueryEntity<'user.query'>,
    {
      id: 2,
      uid: 1001,
      username: 'anotheruser',
      userns_idmap: 2001,
      local: true,
    } as WebUiQueryEntity<'user.query'>,
  ];

  const mockGroups = [
    {
      id: 10,
      gid: 1000,
      group: 'testgroup',
      userns_idmap: directIdMapping,
      local: true,
    } as WebUiQueryEntity<'group.query'>,
    {
      id: 11,
      gid: 1001,
      group: 'anothergroup',
      userns_idmap: 2002,
      local: true,
    } as WebUiQueryEntity<'group.query'>,
  ];

  const createComponent = createComponentFactory({
    component: MapUserGroupIdsDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockTypedApi([
        mockTypedQuery('user.query', mockUsers),
        mockTypedQuery('group.query', mockGroups),
        mockTypedCall('user.update', null),
        mockTypedCall('group.update', null),
      ]),
      mockProvider(DialogRef),
      mockProvider(UserService, mockUserService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(TypedApiService);
    // The typed double answers queries on a microtask, after the change detection that set
    // `[loading]`. Without automatic change detection nothing drops it again before the fake
    // progress bar's grace timer fires, which then starts a redraw interval the fixture never
    // settles past — so every load (on init, and on switching to Groups) would hang the harness.
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();
  });

  it('loads users on init', () => {
    expect(api.query).toHaveBeenCalledWith('user.query', [
      ['local', '=', true], ['userns_idmap', '!=', null],
    ]);
  });

  it('displays users by default', async () => {
    const table = await loader.getHarness(TnTableHarness);

    expect(await table.getRowCount()).toBe(2);

    expect(await table.getCellText(0, 'name')).toBe('testuser');
    expect(await table.getCellText(0, 'hostUidOrGid')).toBe('1000');
    expect(await table.getCellText(0, 'instanceUidOrGid')).toBe('Same');

    expect(await table.getCellText(1, 'name')).toBe('anotheruser');
    expect(await table.getCellText(1, 'hostUidOrGid')).toBe('1001');
    expect(await table.getCellText(1, 'instanceUidOrGid')).toBe('2001');
  });

  it('switches to groups when type is changed', async () => {
    const groupsToggle = await loader.getHarness(TnButtonToggleHarness.with({ label: 'Groups' }));
    await groupsToggle.check();

    expect(spectator.component.typeControl.value).toBe(ViewType.Groups);
  });

  it('deletes user mapping when delete button is clicked', async () => {
    const deleteButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-delete' }));
    await deleteButtons[0].click();

    expect(api.call).toHaveBeenCalledWith('user.update', [1, { userns_idmap: null }]);
  });

  it('reloads mappings when a new mapping is added', () => {
    jest.mocked(api.query).mockClear();

    spectator.triggerEventHandler('ix-new-mapping-form', 'mappingAdded', undefined);
    spectator.detectChanges();

    expect(api.query).toHaveBeenCalledWith('user.query', [
      ['local', '=', true], ['userns_idmap', '!=', null],
    ]);
  });

  it('closes dialog when close button is clicked', () => {
    const dialogRef = spectator.inject(DialogRef);
    jest.spyOn(dialogRef, 'close');

    spectator.click('.tn-dialog__close');

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
