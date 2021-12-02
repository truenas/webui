import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { PreferencesService } from 'app/core/services/preferences.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { IxTableModule } from 'app/pages/common/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/pages/common/ix-tables/testing/ix-table.harness';
import { DialogService, ModalService, WebSocketService } from 'app/services';
import { CoreService } from '../../../../core/services/core-service/core.service';
import { UserListComponent } from './user-list.component';

const fakeDataSource: User[] = [{
  id: 1,
  uid: 0,
  username: 'root',
  smbhash: '',
  home: '/root',
  shell: '/usr/bin/zsh',
  full_name: 'root',
  builtin: true,
  smb: false,
  password_disabled: false,
  locked: false,
  sudo: false,
  sudo_nopasswd: false,
  sudo_commands: [],
  microsoft_account: false,
  email: 'root@root.root',
  group: {
    id: 41,
    bsdgrp_gid: 0,
    bsdgrp_group: 'root',
    bsdgrp_builtin: true,
    bsdgrp_sudo: false,
    bsdgrp_sudo_nopasswd: false,
    bsdgrp_sudo_commands: [],
    bsdgrp_smb: false,
  },
  groups: [],
}, {
  id: 69,
  uid: 1004,
  username: 'test',
  home: '/home/test',
  shell: '/usr/bin/bash',
  full_name: 'test',
  builtin: false,
  smb: true,
  password_disabled: false,
  locked: false,
  sudo: false,
  sudo_nopasswd: false,
  sudo_commands: [],
  microsoft_account: false,
  email: null,
  group: {
    id: 101,
    bsdgrp_gid: 1004,
    bsdgrp_group: 'test',
    bsdgrp_builtin: false,
    bsdgrp_sudo: false,
    bsdgrp_sudo_nopasswd: false,
    bsdgrp_sudo_commands: [],
    bsdgrp_smb: false,
  },
  groups: [
    94,
  ],
}] as User[];

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let modal: ModalService;

  const createComponent = createComponentFactory({
    component: UserListComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.query', fakeDataSource),
        mockCall('user.update'),
        mockCall('user.create'),
        mockCall('user.delete'),
        mockCall('group.query'),
      ]),
      mockProvider(DialogService),
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => of(true)),
        onClose$: new Subject<unknown>(),
      }),
      mockProvider(PreferencesService, {
        preferences: {
          showUserListMessage: false,
          hide_builtin_users: false,
        } as Preferences,
        savePreferences: jest.fn(),
      }),
      mockProvider(CoreService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    modal = spectator.inject(ModalService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);

    // TODO: Find a way to get structured data from expanded row
    const expectedRows = [
      ['Username', 'UID', 'Builtin', 'Full Name', ''],
      ['root', '0', 'true', 'root', 'expand_more'],
      [
        'GID:0Home Directory:/rootShell:/usr/bin/zshEmail:root@root.rootPassword Disabled:falseLock User:falsePermit Sudo:falseMicrosoft Account:falseSamba Authentication:falseeditEdit',
      ],
      ['test', '1004', 'false', 'test', 'expand_more'],
      [
        'GID:1004Home Directory:/home/testShell:/usr/bin/bashEmail:–Password Disabled:falseLock User:falsePermit Sudo:falseMicrosoft Account:falseSamba Authentication:trueeditEditdeleteDelete',
      ],
    ];

    expect(ws.call).toHaveBeenCalledWith('user.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    spectator.fixture.componentInstance.loading = false;
    spectator.fixture.componentInstance.error = false;
    spectator.fixture.componentInstance.createDataSource();
    spectator.detectComponentChanges();

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No Users']]);
  });

  it('should have error message when can not retrieve response', async () => {
    spectator.fixture.componentInstance.loading = false;
    spectator.fixture.componentInstance.error = true;
    spectator.fixture.componentInstance.createDataSource();
    spectator.detectComponentChanges();

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Can not retrieve response']]);
  });

  it('should open edit user form', async () => {
    jest.spyOn(modal, 'openInSlideIn').mockImplementation();

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'editEdit' }));
    await editButton.click();

    expect(modal.openInSlideIn).toHaveBeenCalledWith(UserFormComponent, 1);
  });

  xit('should display confirm dialog of deleting user', async () => {
    // TODO: Fix this

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'deleteDelete' }));
    await deleteButton.click();

    expect(ws.call).toHaveBeenCalledWith('user.delete');
  });

  it('should expand row on click', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const [firstRow] = await table.getRows();

    const element = await firstRow.host();
    await element.click();

    expect(element.hasClass('expanded-row')).toBeTruthy();
  });
});
