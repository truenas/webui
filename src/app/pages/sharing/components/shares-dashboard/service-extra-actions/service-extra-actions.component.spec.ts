import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnIconButtonHarness, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UrlOptionsService } from 'app/services/url-options.service';

describe('ServiceExtraActionsComponent', () => {
  let spectator: Spectator<ServiceExtraActionsComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ServiceExtraActionsComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockJob('service.control', fakeSuccessfulJob()),
      ]),
      mockProvider(SnackbarService),
      mockProvider(Router),
      mockProvider(UrlOptionsService),
      mockProvider(SlideIn),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => <T>(source$: T) => source$),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => <T>(source$: T) => source$),
      }),
    ],
  });

  async function openMenu(service: Service): Promise<TnMenuHarness> {
    spectator = createComponent({
      props: { service },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TnMenuTesting.rootLoader(spectator.fixture);

    const trigger = await loader.getHarness(TnIconButtonHarness);
    await trigger.click();

    return rootLoader.getHarness(TnMenuHarness);
  }

  it('shows a menu with available actions for NVMe-oF', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.NvmeOf,
      state: ServiceStatus.Stopped,
      enable: false,
    } as Service);

    expect(await menu.getItemLabels()).toEqual(['Turn On Service', 'Config Service']);
  });

  it('shows a menu with available actions for NFS', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.Nfs,
      state: ServiceStatus.Stopped,
      enable: false,
    } as Service);

    expect(await menu.getItemLabels()).toEqual(['Turn On Service', 'Config Service', 'NFS Sessions']);
  });

  it('shows a menu with available actions for SMB', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.Cifs,
      state: ServiceStatus.Running,
      enable: false,
    } as Service);

    expect(await menu.getItemLabels()).toEqual([
      'Turn Off Service',
      'Config Service',
      'SMB Sessions',
      'Audit Logs',
    ]);
  });

  it('shows a menu with available actions for iSCSI', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.Iscsi,
      state: ServiceStatus.Running,
      enable: false,
    } as Service);

    expect(await menu.getItemLabels()).toEqual(['Turn Off Service', 'Config Service']);
  });

  it('stops the service when Turn Off Service is selected', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.Cifs,
      state: ServiceStatus.Running,
      enable: false,
    } as Service);

    await menu.clickItem({ label: 'Turn Off Service' });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'service.control',
      [ServiceOperation.Stop, ServiceName.Cifs, { silent: false }],
    );
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('starts the service when Turn On Service is selected', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.Cifs,
      state: ServiceStatus.Stopped,
      enable: false,
    } as Service);

    await menu.clickItem({ label: 'Turn On Service' });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'service.control',
      [ServiceOperation.Start, ServiceName.Cifs, { silent: false }],
    );
  });

  it('navigates to audit logs with correct service parameter when Audit Logs is clicked', async () => {
    const menu = await openMenu({
      id: 1,
      service: ServiceName.Cifs,
      state: ServiceStatus.Running,
      enable: false,
    } as Service);

    const urlOptionsService = spectator.inject(UrlOptionsService);
    const router = spectator.inject(Router);
    jest.spyOn(urlOptionsService, 'buildUrl').mockReturnValue('/system/audit/{"service":"SMB"}');
    jest.spyOn(router, 'navigateByUrl');

    await menu.clickItem({ label: 'Audit Logs' });

    expect(urlOptionsService.buildUrl).toHaveBeenCalledWith('/system/audit', {
      service: AuditService.Smb,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/system/audit/{"service":"SMB"}');
  });
});
