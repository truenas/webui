import { Router } from '@angular/router';
import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceWebshareComponent } from 'app/pages/services/components/service-webshare/service-webshare.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UrlOptionsService } from 'app/services/url-options.service';

class MockTranslateService {
  // Mirrors ngx-translate's interpolation so menu labels match production output.
  instant(key: string, params?: Record<string, unknown>): string {
    if (!params) {
      return key;
    }
    return key.replace(/{\s*(\w+)\s*}/g, (_, name: string) => String(params[name] ?? ''));
  }
}

function service(overrides: Partial<Service>): Service {
  return {
    id: 1,
    state: ServiceStatus.Stopped,
    enable: false,
    ...overrides,
  } as Service;
}

describe('ServiceActionsMenuService', () => {
  let spectator: SpectatorService<ServiceActionsMenuService>;

  const createService = createServiceFactory({
    service: ServiceActionsMenuService,
    providers: [
      { provide: TranslateService, useClass: MockTranslateService },
      mockApi([
        mockJob('service.control', fakeSuccessfulJob()),
      ]),
      mockProvider(SnackbarService),
      mockProvider(Router),
      mockProvider(FormSidePanelService),
      mockProvider(UrlOptionsService),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => <T>(source$: T): T => source$),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => <T>(source$: T): T => source$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('buildMenuItems', () => {
    it('builds toggle and config items for NVMe-oF', () => {
      const items = spectator.service.buildMenuItems(
        service({ service: ServiceName.NvmeOf, state: ServiceStatus.Stopped }),
        true,
      );

      expect(items.map((item) => item.label)).toEqual(['Turn On Service', 'Config Service']);
    });

    it('adds the Sessions item for NFS', () => {
      const items = spectator.service.buildMenuItems(
        service({ service: ServiceName.Nfs, state: ServiceStatus.Stopped }),
        true,
      );

      expect(items.map((item) => item.label)).toEqual(['Turn On Service', 'Config Service', 'NFS Sessions']);
    });

    it('adds Sessions and Audit Logs items for SMB', () => {
      const items = spectator.service.buildMenuItems(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
        true,
      );

      expect(items.map((item) => item.label)).toEqual([
        'Turn Off Service',
        'Config Service',
        'SMB Sessions',
        'Audit Logs',
      ]);
    });

    it('omits the toggle item when the user lacks the control role', () => {
      const items = spectator.service.buildMenuItems(
        service({ service: ServiceName.Iscsi, state: ServiceStatus.Running }),
        false,
      );

      expect(items.map((item) => item.id)).toEqual(['service-config']);
    });
  });

  describe('buildServiceCardMenu', () => {
    it('returns undefined when there is no service', () => {
      expect(spectator.service.buildServiceCardMenu(undefined, true, jest.fn())).toBeUndefined();
    });

    it('routes the Config Service item to the card-local handler', () => {
      const openLocalConfig = jest.fn();
      const items = spectator.service.buildServiceCardMenu(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
        true,
        openLocalConfig,
      );

      const configItem = items?.find((item) => item.id === 'service-config');
      configItem?.action?.();

      expect(openLocalConfig).toHaveBeenCalled();
    });

    it('does not include the service on/off toggle (exposed as a header control instead)', () => {
      const items = spectator.service.buildServiceCardMenu(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
        true,
        jest.fn(),
      );

      expect(items?.map((item) => item.id)).not.toContain('service-state-toggle');
    });
  });

  describe('service control helpers', () => {
    it('reports whether the service is running', () => {
      expect(spectator.service.isServiceRunning(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
      )).toBe(true);
      expect(spectator.service.isServiceRunning(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Stopped }),
      )).toBe(false);
    });

    it('builds a stable control test id from the service name', () => {
      expect(spectator.service.serviceControlTestId(
        service({ service: ServiceName.Cifs }),
      )).toBe('service-cifs');
    });

    it('stops a running service when toggled', () => {
      spectator.service.toggleServiceState(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
      );

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'service.control',
        [ServiceOperation.Stop, ServiceName.Cifs, { silent: false }],
      );
    });

    it('starts a stopped service when toggled', () => {
      spectator.service.toggleServiceState(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Stopped }),
      );

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'service.control',
        [ServiceOperation.Start, ServiceName.Cifs, { silent: false }],
      );
    });
  });

  describe('service state actions', () => {
    it('stops a running service and shows a snackbar', () => {
      const items = spectator.service.buildMenuItems(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
        true,
      );
      items.find((item) => item.id === 'service-state-toggle')?.action?.();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'service.control',
        [ServiceOperation.Stop, ServiceName.Cifs, { silent: false }],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('starts a stopped service', () => {
      const items = spectator.service.buildMenuItems(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Stopped }),
        true,
      );
      items.find((item) => item.id === 'service-state-toggle')?.action?.();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'service.control',
        [ServiceOperation.Start, ServiceName.Cifs, { silent: false }],
      );
    });
  });

  describe('configureService', () => {
    const cases: [ServiceName, unknown][] = [
      [ServiceName.NvmeOf, NvmeOfConfigurationComponent],
      [ServiceName.Iscsi, GlobalTargetConfigurationComponent],
      [ServiceName.Nfs, ServiceNfsComponent],
      [ServiceName.Cifs, ServiceSmbComponent],
      [ServiceName.WebShare, ServiceWebshareComponent],
    ];

    cases.forEach(([serviceName, component]) => {
      it(`opens the side panel for ${serviceName}`, () => {
        const config = spectator.service.buildConfigItem(service({ service: serviceName }));
        config.action?.();

        const openSpy = spectator.inject(FormSidePanelService).open;
        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(openSpy.mock.calls[0][0]).toBe(component);
      });
    });
  });

  describe('viewLogs', () => {
    it('navigates to the SMB audit log url', () => {
      const urlOptions = spectator.inject(UrlOptionsService);
      const router = spectator.inject(Router);
      jest.spyOn(urlOptions, 'buildUrl').mockReturnValue('/system/audit/{"service":"SMB"}');

      spectator.service.buildLogsItem(service({ service: ServiceName.Cifs }))?.action?.();

      expect(urlOptions.buildUrl).toHaveBeenCalledWith('/system/audit', { service: AuditService.Smb });
      expect(router.navigateByUrl).toHaveBeenCalledWith('/system/audit/{"service":"SMB"}');
    });
  });

  describe('buildCardHeaderStatus', () => {
    it('returns undefined when there is no service', () => {
      expect(spectator.service.buildCardHeaderStatus(undefined)).toBeUndefined();
    });

    it('maps Running to a success status with a kebab-cased test id', () => {
      expect(spectator.service.buildCardHeaderStatus(
        service({ service: ServiceName.Cifs, state: ServiceStatus.Running }),
      )).toEqual({ label: 'Running', type: 'success', testId: 'button-service-status-cifs' });
    });

    it('maps Stopped to a neutral status', () => {
      expect(spectator.service.buildCardHeaderStatus(
        service({ service: ServiceName.Nfs, state: ServiceStatus.Stopped }),
      )).toMatchObject({ type: 'neutral' });
    });
  });

  describe('test id helpers', () => {
    it('builds a menu item test id matching the legacy ixTest value', () => {
      expect(spectator.service.menuItemTestId(
        service({ service: ServiceName.Iscsi }),
        'Config Service',
      )).toBe('button-iscsitarget-actions-menu-config-service');
    });

    it('builds the card-header menu trigger test id', () => {
      expect(spectator.service.cardHeaderMenuTriggerTestId(service({ id: 7 }))).toBe('button-7-actions-menu');
      expect(spectator.service.cardHeaderMenuTriggerTestId(undefined)).toBeUndefined();
    });
  });
});
