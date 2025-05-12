import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import {
  IxTableExpandableRowComponent,
} from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import {
  DeleteGroupDialog,
} from 'app/pages/credentials/groups/group-details-row/delete-group-dialog/delete-group-dialog.component';
import { GroupDetailsRowComponent } from 'app/pages/credentials/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const dummyGroup = {
  id: 1,
  gid: 1000,
  group: 'dummy',
  local: true,
  builtin: false,
  smb: true,
  users: [] as number[],
} as Group;

describe('GroupDetailsRowComponent', () => {
  let spectator: SpectatorRouting<GroupDetailsRowComponent>;
  let loader: HarnessLoader;

  const slideInRef: SlideInRef<Group | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => dummyGroup),
  };

  const createComponent = createRoutingFactory({
    component: GroupDetailsRowComponent,
    imports: [
      IxTableExpandableRowComponent,
      MockComponent(GroupFormComponent),
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockApi([
        mockCall('user.query'),
        mockCall('group.delete'),
        mockCall('group.query', []),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              hideBuiltinUsers: false,
            } as Preferences,
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        group: dummyGroup,
        colspan: 5,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks colspan attribute', () => {
    expect(spectator.query('td')!.getAttribute('colspan')).toBe('5');
  });

  describe('Members button', () => {
    it('should redirect to group members form', async () => {
      const membersButton = await loader.getHarness(MatButtonHarness.with({ text: 'Members' }));
      await membersButton.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups', 1, 'members']);
    });

    it('does not show Members button for non-local groups', async () => {
      spectator.setInput('group', { ...dummyGroup, local: false });

      const membersButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Members' }));
      expect(membersButton).toBeNull();
    });
  });

  describe('Edit button', () => {
    it('should open edit group form', async () => {
      const editButton = await loader.getHarness(MatButtonHarness.with({ text: /Edit/ }));
      await editButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(GroupFormComponent, { data: dummyGroup });
    });

    it('does not show Edit button for built-in groups', async () => {
      spectator.setInput('group', { ...dummyGroup, builtin: true });

      const editButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Edit' }));
      expect(editButton).toBeNull();
    });

    it('does not show Edit button for Active Directory groups', async () => {
      spectator.setInput('group', { ...dummyGroup, local: false });

      const editButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Edit' }));
      expect(editButton).toBeNull();
    });
  });

  it('should open DeleteUserGroup when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteGroupDialog, {
      data: dummyGroup,
    });
  });
});
