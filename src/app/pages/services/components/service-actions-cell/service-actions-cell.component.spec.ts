import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceActionsCellComponent } from 'app/pages/services/components/service-actions-cell/service-actions-cell.component';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { NvmeOfConfigurationComponent } from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';

describe('ServiceActionsCellComponent', () => {
  let spectator: SpectatorHost<ServiceActionsCellComponent>;
  let loader: ReturnType<typeof TestbedHarnessEnvironment.loader>;
  let api: ApiService;

  const createHost = createHostFactory({
    component: ServiceActionsCellComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('service.update', 1),
        mockJob('service.start', fakeSuccessfulJob()),
        mockJob('service.stop', fakeSuccessfulJob()),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
    shallow: false,
  });

  function setup(service: Partial<Service>): void {
    spectator = createHost('<ix-service-actions-cell [service]="service"></ix-service-actions-cell>', {
      hostProps: { service: service as Service },
    });

    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows "View Logs" and "View Sessions" for CIFS', () => {
    setup({ service: ServiceName.Cifs, state: ServiceStatus.Running });

    const links = spectator.queryAll('a');

    const hasViewLogs = links.some((el) => el.textContent?.includes('View Logs'));
    expect(hasViewLogs).toBe(true);

    const hasViewSessions = links.some((el) => el.textContent?.includes('View Sessions'));
    expect(hasViewSessions).toBe(true);
  });

  it('shows only "View Sessions" for NFS', () => {
    setup({ service: ServiceName.Nfs, state: ServiceStatus.Running });

    const links = spectator.queryAll('a');

    const hasViewSessions = links.some((el) => el.textContent?.includes('View Sessions'));
    expect(hasViewSessions).toBe(true);
  });

  it('shows "Start Service" icon when service is stopped', async () => {
    setup({ service: ServiceName.Ftp, state: ServiceStatus.Stopped });

    const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
    expect(startIcon).toBeTruthy();

    await startIcon.click();

    expect(api.job).toHaveBeenCalledWith('service.start', [ServiceName.Ftp, { silent: false }]);
  });

  it('shows "Stop Service" icon when service is running', async () => {
    setup({ service: ServiceName.Ftp, state: ServiceStatus.Running });

    const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
    expect(stopIcon).toBeTruthy();

    await stopIcon.click();

    expect(api.job).toHaveBeenCalledWith('service.stop', [ServiceName.Ftp, { silent: false }]);
  });

  describe('edit', () => {
    it('should open NVMe-oF global configuration form', async () => {
      setup({ service: ServiceName.NvmeOf, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NvmeOfConfigurationComponent);
    });

    it('should open iSCSI global configuration form', async () => {
      setup({ service: ServiceName.Iscsi, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(GlobalTargetConfigurationComponent);
    });

    it('should open FTP configuration when edit button is pressed', async () => {
      setup({ service: ServiceName.Ftp, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ServiceFtpComponent, { wide: true });
    });

    it('should open NFS configuration when edit button is pressed', async () => {
      setup({ service: ServiceName.Nfs, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ServiceNfsComponent, { wide: true });
    });

    it('should open SNMP configuration when edit button is pressed', async () => {
      setup({ service: ServiceName.Snmp, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ServiceSnmpComponent, { wide: true });
    });

    it('should open UPS configuration when edit button is pressed', async () => {
      setup({ service: ServiceName.Ups, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ServiceUpsComponent, { wide: true });
    });

    it('should open SSH configuration when edit button is pressed', async () => {
      setup({ service: ServiceName.Ssh, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ServiceSshComponent);
    });

    it('should open SMB configuration when edit button is pressed', async () => {
      setup({ service: ServiceName.Cifs, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ServiceSmbComponent);
    });
  });
});
