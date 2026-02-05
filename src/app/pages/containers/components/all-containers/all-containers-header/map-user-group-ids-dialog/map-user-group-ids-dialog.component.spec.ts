import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
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
import { MappingType } from './mapping.types';

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
      name: 'testgroup',
      userns_idmap: directIdMapping,
      local: true,
    } as Group,
    {
      id: 11,
      gid: 1001,
      name: 'anothergroup',
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
      mockProvider(UserService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads users on init', () => {
    expect(api.call).toHaveBeenCalledWith('user.query', [[
      [['local', '=', true], ['userns_idmap', '!=', null]],
    ]]);
    expect(spectator.component.users()).toEqual(mockUsers);
  });

  it('loads groups on init', () => {
    expect(api.call).toHaveBeenCalledWith('group.query', [[
      [['local', '=', true], ['userns_idmap', '!=', null]],
    ]]);
    expect(spectator.component.groups()).toEqual(mockGroups);
  });

  it('displays users by default', () => {
    expect(spectator.component.selectedType()).toBe(MappingType.Users);

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
    await buttonGroup.pressButton('Groups');

    expect(spectator.component.selectedType()).toBe(MappingType.Groups);

    const rows = spectator.queryAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveText('testgroup');
    expect(rows[0]).toHaveText('1000');
    expect(rows[0]).toHaveText('Same');
  });

  it('deletes user mapping when delete button is clicked', async () => {
    jest.spyOn(api, 'call').mockReturnValue(of(null));

    const deleteButtons = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[ixtest="delete-mapping"]' }));
    await deleteButtons[0].click();

    expect(api.call).toHaveBeenCalledWith('user.update', [1, { userns_idmap: null }]);
  });

  it('deletes group mapping when delete button is clicked', async () => {
    jest.spyOn(api, 'call').mockReturnValue(of(null));

    const buttonGroup = await loader.getHarness(IxButtonGroupHarness);
    await buttonGroup.pressButton('Groups');

    const deleteButtons = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[ixtest="delete-mapping"]' }));
    await deleteButtons[0].click();

    expect(api.call).toHaveBeenCalledWith('group.update', [10, { userns_idmap: null }]);
  });

  it('reloads mappings when a new mapping is added', () => {
    jest.spyOn(api, 'call');

    spectator.component.onMappingAdded();

    expect(api.call).toHaveBeenCalledWith('user.query', expect.anything());
    expect(api.call).toHaveBeenCalledWith('group.query', expect.anything());
  });

  it('closes dialog when close button is clicked', async () => {
    const dialogRef = spectator.inject(MatDialogRef);
    jest.spyOn(dialogRef, 'close');

    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await closeButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('shows "No mappings configured" message when there are no mappings', () => {
    jest.spyOn(api, 'call').mockReturnValue(of([]));
    spectator.component.loadMappings();
    spectator.detectChanges();

    expect(spectator.query('.no-mappings')).toHaveText('No mappings configured');
  });
});
