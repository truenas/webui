import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { ServiceRow } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ServiceStateColumnComponent,
} from 'app/pages/services/components/service-state-column/service-state-column.component';
import { IscsiService } from 'app/services/iscsi.service';

describe('ServiceStateColumnComponent', () => {
  let spectator: Spectator<ServiceStateColumnComponent>;
  let toggle: MatSlideToggleHarness;
  const service = {
    service: ServiceName.Cifs,
    state: ServiceStatus.Running,
  } as ServiceRow;
  const createComponent = createComponentFactory({
    component: ServiceStateColumnComponent,
    providers: [
      mockProvider(IscsiService, {
        getGlobalSessions: jest.fn(() => of([])),
      }),
      mockApi([
        mockCall('service.start', true),
        mockCall('service.stop', true),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.setRow(service);

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    toggle = await loader.getHarness(MatSlideToggleHarness);
  });

  it('shows whether service is currently running or not', async () => {
    expect(await toggle.isChecked()).toBe(true);

    spectator.component.setRow({ ...service, state: ServiceStatus.Stopped });
    expect(await toggle.isChecked()).toBe(false);
  });

  describe('stopping a service', () => {
    it('asks for confirmation when user tries to stop a service', async () => {
      await toggle.toggle();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Stop SMB?',
        }),
      );
    });

    it('asks for a different confirmation when user tries to stop iSCSI and there are active sessions', async () => {
      spectator
        .inject(IscsiService)
        .getGlobalSessions
        .mockReturnValueOnce(of([{ target: '123' }] as IscsiGlobalSession[]));

      spectator.component.setRow({ ...service, service: ServiceName.Iscsi });

      await toggle.toggle();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('There is an active iSCSI connection.'),
        }),
      );
    });

    it('stops the service when user confirms', async () => {
      await toggle.toggle();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('service.stop', [service.service, { silent: false }]);
    });
  });

  describe('starting a service', () => {
    it('starts the service when user changes toggle on a non-running service', async () => {
      spectator.component.setRow({ ...service, state: ServiceStatus.Stopped });

      await toggle.toggle();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('service.start', [service.service, { silent: false }]);
    });
  });
});
