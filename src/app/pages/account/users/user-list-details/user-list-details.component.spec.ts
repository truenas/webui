import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator';
import { of, Subject } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { IxTableModule } from 'app/pages/common/ix-tables/ix-table.module';
import { DialogService, ModalService } from 'app/services';
import { WebSocketService } from 'app/services/ws.service';
import { UserListDetailsComponent } from './user-list-details.component';

describe('UserListDetailsComponent', () => {
  let spectator: Spectator<UserListDetailsComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let modal: ModalService;

  const createComponent = createComponentFactory({
    component: UserListDetailsComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.query', []),
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

  xit('should open edit user form', async () => {
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
});
