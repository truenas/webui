import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Group } from 'app/interfaces/group.interface';
import { directIdMapping, User } from 'app/interfaces/user.interface';
import { IxButtonGroupHarness } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.harness';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  MapUserGroupIdsDialogComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import {
  ViewType,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/mapping.types';
import {
  NewMappingFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/new-mapping-form/new-mapping-form.component';

describe('MapUserGroupIdsDialogComponent', () => {
  let spectator: Spectator<MapUserGroupIdsDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: MapUserGroupIdsDialogComponent,
    overrideComponents: [
      [
        MapUserGroupIdsDialogComponent,
        {
          remove: { imports: [NewMappingFormComponent] },
          add: { imports: [MockComponent(NewMappingFormComponent)] },
        },
      ],
    ],
    providers: [
      mockApi([
        mockCall('user.query', [
          {
            id: 1221,
            username: 'john',
            uid: 2000,
            userns_idmap: directIdMapping,
          },
          {
            id: 1222,
            username: 'bob',
            uid: 3000,
            userns_idmap: 6000,
          },
        ] as User[]),
        mockCall('group.query', [
          {
            id: 1231,
            group: 'admins',
            gid: 1000,
            userns_idmap: directIdMapping,
          },
          {
            id: 1232,
            group: 'users',
            gid: 2000,
            userns_idmap: 4000,
          },
        ] as Group[]),
        mockCall('user.update'),
        mockCall('group.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('users', () => {
    it('shows a list of users that have mapping', () => {
      // TODO: Here and in other components, provide a helper to work with MatTableHarness.
      const rows = spectator.queryAll('tbody tr').map((row) => {
        return Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
      });

      expect(rows).toEqual([
        ['john', '2000', 'Same', ''],
        ['bob', '3000', '6000', ''],
      ]);
    });

    it('queries API with correct filters to list users', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.query', [[['local', '=', true], ['userns_idmap', '!=', null]]]);
    });

    it('allows mapping to be removed (reset)', async () => {
      const removeButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await removeButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [1221, { userns_idmap: null }]);
    });

    it('shows a form to add a new mapping and reloads a list when it is added', () => {
      const form = spectator.query(NewMappingFormComponent);
      expect(form.type).toBe(ViewType.Users);

      form.mappingAdded.emit();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
    });
  });

  describe('groups', () => {
    beforeEach(async () => {
      const typeSelector = await loader.getHarness(IxButtonGroupHarness);
      await typeSelector.setValue('Groups');
    });

    it('shows a list of groups that have mapping', () => {
      // TODO: Here and in other components, provide a helper to work with MatTableHarness.
      const rows = spectator.queryAll('tbody tr').map((row) => {
        return Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
      });

      expect(rows).toEqual([
        ['admins', '1000', 'Same', ''],
        ['users', '2000', '4000', ''],
      ]);
    });

    it('queries API with correct filters to list groups', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('group.query', [[['local', '=', true], ['userns_idmap', '!=', null]]]);
    });

    it('allows mapping to be removed (reset)', async () => {
      const removeButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await removeButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('group.update', [1231, { userns_idmap: null }]);
    });

    it('shows a form to add a new mapping and reloads a list when it is added', () => {
      const form = spectator.query(NewMappingFormComponent);
      expect(form.type).toBe(ViewType.Groups);

      form.mappingAdded.emit();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(3);
    });
  });
});
