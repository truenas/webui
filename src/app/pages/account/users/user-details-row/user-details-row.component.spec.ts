import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import {
  WebSocketService, DialogService, AppLoaderService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { UserDetailsRowComponent } from './user-details-row.component';

const dummyUser = {
  id: 1,
  uid: 0,
  username: 'test-user',
  smbhash: '',
  home: '/test-user',
  shell: '/usr/bin/zsh',
  full_name: 'test-user',
  builtin: false,
  smb: false,
  password_disabled: false,
  locked: false,
  sudo: false,
  sudo_nopasswd: false,
  sudo_commands: [],
  email: 'test-user@test-user.com',
  group: {
    id: 41,
    bsdgrp_gid: 0,
    bsdgrp_group: 'test-user',
  },
  groups: [],
} as User;

describe('UserDetailsRowComponent', () => {
  let spectator: Spectator<UserDetailsRowComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let dialog: DialogService;

  const createComponent = createComponentFactory({
    component: UserDetailsRowComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    declarations: [
      UserFormComponent,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('user.delete'),
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
        user: dummyUser,
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

  it('should open edit user form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'editEdit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(UserFormComponent, { wide: true });
  });

  it('should make websocket call to delete user', async () => {
    jest.spyOn(dialog, 'dialogForm').mockImplementation();
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'deleteDelete' }));
    await deleteButton.click();

    expect(dialog.dialogForm).toHaveBeenCalled();
    expect(ws.call).toHaveBeenCalledWith('group.query', [[['id', '=', 41]]]);
  });
});
