import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectorRef } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { fakeDataSource } from 'app/pages/account/users/user-list/user-list.component.spec';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { IxTableComponent } from 'app/pages/common/ix-tables/components/ix-table/ix-table.component';
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
    declarations: [
      MockComponent(IxTableComponent),
    ],
    providers: [
      mockWebsocket([
        mockCall('user.query', fakeDataSource),
        mockCall('user.update'),
        mockCall('user.create'),
        mockCall('user.delete'),
        mockCall('group.query'),
      ]),
      mockProvider(DialogService, {
        dialogForm: jest.fn(() => of(true)),
      }),
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => of(true)),
      }),
      mockProvider(IxTableComponent),
      mockProvider(ChangeDetectorRef),
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
