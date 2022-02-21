import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { DialogService, ModalService, WebSocketService } from 'app/services';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { CoreService } from '../../../../services/core-service/core.service';
import { UserListComponent } from './user-list.component';

export const fakeDataSource: User[] = [{
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
  },
  groups: [
    94,
  ],
}] as User[];

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: UserListComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    declarations: [
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
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              showUserListMessage: false,
              hideBuiltinUsers: false,
            } as Preferences,
          },
        ],
      }),
      mockProvider(CoreService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);

    const expectedRows = [
      ['Username', 'UID', 'Builtin', 'Full Name', ''],
      ['root', '0', 'true', 'root', 'expand_more'],
      ['test', '1004', 'false', 'test', 'expand_more'],
    ];

    expect(ws.call).toHaveBeenCalledWith('user.query');
    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    spectator.fixture.componentInstance.loading = false;
    spectator.fixture.componentInstance.error = false;
    spectator.fixture.componentInstance.createDataSource();

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No Users']]);
  });

  it('should have error message when can not retrieve response', async () => {
    spectator.fixture.componentInstance.loading = false;
    spectator.fixture.componentInstance.error = true;
    spectator.fixture.componentInstance.createDataSource();

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Can not retrieve response']]);
  });

  it('should expand row on click', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const [firstRow] = await table.getRows();

    const element = await firstRow.host();
    await element.click();

    expect(await element.hasClass('expanded')).toBeTruthy();
  });

  it('should expand only one row on click', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const [firstRow, secondRow] = await table.getRows();

    const firstRowElement = await firstRow.host();
    await firstRowElement.click();

    const secondRowElement = await secondRow.host();
    await secondRowElement.click();

    expect(spectator.queryAll('.expanded').length).toEqual(1);
  });
});
