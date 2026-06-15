import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonComponent, TnButtonHarness, TnTooltipDirective } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
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
      TnButtonComponent,
      TnTooltipDirective,
      MockComponent(GroupFormComponent),
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
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
            value: {} as Preferences,
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
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('Members button', () => {
    it('should redirect to group members form', async () => {
      const membersButton = await loader.getHarness(TnButtonHarness.with({ label: 'Members' }));
      await membersButton.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups', 1, 'members']);
    });

    it('does not show Members button for non-local groups', async () => {
      spectator.setInput('group', { ...dummyGroup, local: false });

      const membersButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Members' }));
      expect(membersButton).toBeNull();
    });

    it('should disable Members button for immutable groups', async () => {
      spectator.setInput('group', { ...dummyGroup, immutable: true });

      const membersButton = await loader.getHarness(TnButtonHarness.with({ label: 'Members' }));
      expect(await membersButton.isDisabled()).toBe(true);
    });

    it('should not navigate to members form when clicking disabled Members button for immutable groups', async () => {
      spectator.setInput('group', { ...dummyGroup, immutable: true });

      const membersButton = await loader.getHarness(TnButtonHarness.with({ label: 'Members' }));
      await membersButton.click();

      expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
    });
  });

  describe('Edit button', () => {
    it('should open edit group form', async () => {
      const editButton = await loader.getHarness(TnButtonHarness.with({ label: /Edit/ }));
      await editButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(GroupFormComponent, { data: dummyGroup });
    });

    it('does not show Edit button for built-in groups', async () => {
      spectator.setInput('group', { ...dummyGroup, builtin: true });

      const editButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Edit' }));
      expect(editButton).toBeNull();
    });

    it('does not show Edit button for immutable groups', async () => {
      spectator.setInput('group', { ...dummyGroup, immutable: true });

      const editButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Edit' }));
      expect(editButton).toBeNull();
    });

    it('does not show Edit button for non-local groups', async () => {
      spectator.setInput('group', { ...dummyGroup, local: false });

      const editButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Edit' }));
      expect(editButton).toBeNull();
    });
  });

  it('should disable Delete button for non-local groups', async () => {
    spectator.setInput('group', { ...dummyGroup, local: false });

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));
    expect(await deleteButton.isDisabled()).toBe(true);
  });

  it('should show directory service tooltip for non-local groups', async () => {
    spectator.setInput('group', { ...dummyGroup, local: false });

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));
    expect(deleteButton).toBeTruthy();

    const tooltips = spectator.queryAll(TnTooltipDirective);
    const deleteTooltip = tooltips.find((tooltip) => tooltip.message() === 'This group is managed by a directory service and cannot be deleted.');
    expect(deleteTooltip).toBeTruthy();
  });

  it('should open DeleteUserGroup and emit delete when Delete button is pressed', async () => {
    const deleteSpy = jest.spyOn(spectator.component.delete, 'emit');
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteGroupDialog, {
      data: dummyGroup,
    });
    expect(deleteSpy).toHaveBeenCalledWith(dummyGroup.id);
  });

  it('should disable Delete button when group has roles or users', async () => {
    spectator.setInput('group', { ...dummyGroup, roles: ['admin'], users: [1] });

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));

    expect(await deleteButton.isDisabled()).toBe(true);
  });

  it('should show privileges or members tooltip when group has roles or users', () => {
    spectator.setInput('group', { ...dummyGroup, roles: ['admin'], users: [1] });

    const tooltips = spectator.queryAll(TnTooltipDirective);
    const deleteTooltip = tooltips.find((tooltip) => tooltip.message() === 'Groups with privileges or members cannot be deleted.');
    expect(deleteTooltip).toBeTruthy();
  });
});
