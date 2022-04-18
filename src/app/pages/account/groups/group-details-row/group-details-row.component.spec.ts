import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import {
  WebSocketService, DialogService, AppLoaderService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const dummyGroup = {
  id: 1,
  gid: 1000,
  group: 'dummy',
  builtin: false,
  smb: true,
  users: [],
} as Group;

describe('GroupDetailsRowComponent', () => {
  let spectator: Spectator<GroupDetailsRowComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let dialog: DialogService;

  const createComponent = createComponentFactory({
    component: GroupDetailsRowComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    declarations: [
      GroupFormComponent,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('user.query'),
        mockCall('group.delete'),
        mockCall('group.query', []),
      ]),
      mockProvider(DialogService, {
        dialogForm: jest.fn(() => of(true)),
      }),
      mockProvider(AppLoaderService),
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
    ws = spectator.inject(WebSocketService);
    dialog = spectator.inject(DialogService);
  });

  it('checks colspan attribute', () => {
    expect(spectator.query('td').getAttribute('colspan')).toBe('5');
  });

  it('should open edit group form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'editEdit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(GroupFormComponent, { wide: true });
  });

  it('should make websocket call to delete user', async () => {
    jest.spyOn(dialog, 'dialogForm').mockImplementation();
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'deleteDelete' }));
    await deleteButton.click();

    expect(dialog.dialogForm).toHaveBeenCalled();
    expect(ws.call).toHaveBeenCalledWith('group.delete', 1);
  });
});
