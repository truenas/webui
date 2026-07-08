import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ServiceActionsCellComponent } from 'app/pages/services/components/service-actions-cell/service-actions-cell.component';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { NvmeOfConfigurationComponent } from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { UrlOptionsService } from 'app/services/url-options.service';

describe('ServiceActionsCellComponent', () => {
  let spectator: SpectatorHost<ServiceActionsCellComponent>;
  let loader: ReturnType<typeof TestbedHarnessEnvironment.loader>;

  const createHost = createHostFactory({
    component: ServiceActionsCellComponent,
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router),
      mockProvider(UrlOptionsService),
    ],
    shallow: false,
  });

  function setup(service: Partial<Service>): void {
    spectator = createHost('<ix-service-actions-cell [service]="service"></ix-service-actions-cell>', {
      hostProps: { service: service as Service },
    });

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

  it('navigates to audit logs with correct service parameter for CIFS', () => {
    setup({ service: ServiceName.Cifs, state: ServiceStatus.Running });

    const urlOptionsService = spectator.inject(UrlOptionsService);
    const router = spectator.inject(Router);
    jest.spyOn(urlOptionsService, 'buildUrl').mockReturnValue('/system/audit/{"service":"SMB"}');

    const viewLogsLink = spectator.queryAll('a').find((el) => el.textContent?.includes('View Logs')) as HTMLElement;
    expect(viewLogsLink).toBeTruthy();
    spectator.click(viewLogsLink);

    expect(urlOptionsService.buildUrl).toHaveBeenCalledWith('/system/audit', {
      service: AuditService.Smb,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/system/audit/{"service":"SMB"}']);
  });

  it('navigates to SMB sessions when "View Sessions" is clicked for CIFS', () => {
    setup({ service: ServiceName.Cifs, state: ServiceStatus.Running });
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const link = spectator.queryAll('a').find((el) => el.textContent?.includes('View Sessions')) as HTMLElement;
    spectator.click(link);

    expect(router.navigate).toHaveBeenCalledWith(['/sharing', 'smb', 'status', 'sessions']);
  });

  it('navigates to NFS sessions when "View Sessions" is clicked for NFS', () => {
    setup({ service: ServiceName.Nfs, state: ServiceStatus.Running });
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const link = spectator.queryAll('a').find((el) => el.textContent?.includes('View Sessions')) as HTMLElement;
    spectator.click(link);

    expect(router.navigate).toHaveBeenCalledWith(['/sharing', 'nfs', 'sessions']);
  });

  describe('edit', () => {
    it('should open NVMe-oF global configuration form in the side panel', async () => {
      setup({ service: ServiceName.NvmeOf, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(TnIconHarness.with({ name: 'pencil' }));
      await editIcon.click();

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
        NvmeOfConfigurationComponent,
        { title: 'NVMe-oF Global Configuration' },
      );
    });

    it('should open iSCSI global configuration form in the side panel', async () => {
      setup({ service: ServiceName.Iscsi, state: ServiceStatus.Stopped });

      const editIcon = await loader.getHarness(TnIconHarness.with({ name: 'pencil' }));
      await editIcon.click();

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
        GlobalTargetConfigurationComponent,
        { title: 'iSCSI Global Configuration' },
      );
    });

    // The remaining service forms are hosted in the page-level side panel, so the
    // cell emits `configure` instead of opening the form itself.
    const panelServices = [
      ServiceName.Ftp,
      ServiceName.Nfs,
      ServiceName.Snmp,
      ServiceName.Ups,
      ServiceName.Ssh,
      ServiceName.Cifs,
      ServiceName.WebShare,
    ];

    panelServices.forEach((service) => {
      it(`emits configure (and does not open a form directly) for ${service}`, async () => {
        setup({ service, state: ServiceStatus.Stopped });

        const emitted: Service[] = [];
        spectator.component.configure.subscribe((value) => emitted.push(value));

        const editIcon = await loader.getHarness(TnIconHarness.with({ name: 'pencil' }));
        await editIcon.click();

        expect(emitted).toEqual([expect.objectContaining({ service })]);
        expect(spectator.inject(FormSidePanelService).open).not.toHaveBeenCalled();
      });
    });
  });
});
