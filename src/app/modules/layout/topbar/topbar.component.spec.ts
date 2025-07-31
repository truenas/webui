import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter, signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { UpdateDialog } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { CheckinIndicatorComponent } from 'app/modules/layout/topbar/checkin-indicator/checkin-indicator.component';
import { JobsIndicatorComponent } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { TopbarComponent } from 'app/modules/layout/topbar/topbar.component';
import { TruenasLogoComponent } from 'app/modules/layout/topbar/truenas-logo/truenas-logo.component';
import { UserMenuComponent } from 'app/modules/layout/topbar/user-menu/user-menu.component';
import { ThemeService } from 'app/modules/theme/theme.service';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { TruenasConnectButtonComponent } from 'app/modules/truenas-connect/truenas-connect-button.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { RebootInfoState } from 'app/store/reboot-info/reboot-info.reducer';
import { selectRebootInfo } from 'app/store/reboot-info/reboot-info.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

const fakeRebootInfo: RebootInfoState = {
  thisNodeRebootInfo: {
    boot_id: 'this-boot-id',
    reboot_required_reasons: [
      { code: 'FIPS', reason: 'Test Reason 1' },
      { code: 'FIPS', reason: 'Test Reason 2' },
    ],
  },
  otherNodeRebootInfo: null,
};

describe('TopbarComponent', () => {
  let spectator: Spectator<TopbarComponent>;
  let loader: HarnessLoader;
  const updateRunningStatus$ = new EventEmitter<'true' | 'false'>();
  const mockConfigSignal = signal<TruenasConnectConfig | null>(null);

  const createComponent = createComponentFactory({
    component: TopbarComponent,
    declarations: [
      MockComponents(
        CheckinIndicatorComponent,
        JobsIndicatorComponent,
        UserMenuComponent,
        PowerMenuComponent,
        TruenasLogoComponent,
        TruenasConnectButtonComponent,
        TruecommandButtonComponent,
      ),
    ],
    providers: [
      mockProvider(ThemeService),
      mockProvider(SystemGeneralService, {
        updateRunning: updateRunningStatus$,
        updateRunningNoticeSent: new EventEmitter<string>(),
      }),
      mockProvider(UiSearchProvider),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          componentInstance: {
            setMessage: jest.fn(),
          },
          afterClosed: () => of({}),
        })),
      }),
      mockApi(),
      mockProvider(TruenasConnectService, {
        config: mockConfigSignal,
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectRebootInfo,
            value: fakeRebootInfo,
          },
          {
            selector: selectUpdateJob,
            value: [
              {
                state: JobState.Running,
                arguments: [] as unknown[],
              } as Job,
            ],
          },
          {
            selector: selectGeneralConfig,
            value: {},
          },
          {
            selector: selectImportantUnreadAlertsCount,
            value: 0,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Reboot Info button', async () => {
    const rebootInfoButton = await loader.getHarnessOrNull(
      MatButtonHarness.with({ selector: '[ixTest="reboot-info"]' }),
    );
    expect(rebootInfoButton).not.toBeNull();
  });

  describe('update icon', () => {
    it('shows an icon when there is an active update job', async () => {
      const icon = await loader.getHarness(IxIconHarness.with({ name: 'system_update_alt' }));
      expect(icon).toExist();
    });
  });

  it('checks when update is running and shows the correct text', () => {
    updateRunningStatus$.emit('true');
    spectator.detectChanges();

    expect(spectator.inject(MatDialog).open).toHaveBeenNthCalledWith(1, UpdateDialog, {
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: {
        right: '16px',
        top: '48px',
      },
      width: '400px',
      data: {
        title: 'Update in Progress',
        message: 'A system update is in progress. It might have been launched in another window or by an external source like TrueCommand.',
      },
    });
  });

  describe('hasTncConfig', () => {
    const baseTncConfig: Partial<TruenasConnectConfig> = {
      tnc_base_url: 'https://tnc.example.com',
      account_service_base_url: 'https://account.example.com',
      leca_service_base_url: 'https://leca.example.com',
    };

    it('returns falsy when config is null or undefined', () => {
      mockConfigSignal.set(null);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });

    it('returns falsy when ips and interfaces_ips are both empty', () => {
      mockConfigSignal.set({
        ...baseTncConfig,
        ips: [],
        interfaces_ips: [],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });

    it('returns falsy when missing required URLs even with IPs', () => {
      mockConfigSignal.set({
        ips: ['192.168.1.1'],
        interfaces_ips: [],
        tnc_base_url: '',
        account_service_base_url: '',
        leca_service_base_url: '',
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });

    it('returns truthy when ips array has values and all required URLs are present', () => {
      mockConfigSignal.set({
        ...baseTncConfig,
        ips: ['192.168.1.1'],
        interfaces_ips: [],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeTruthy();
    });

    it('returns truthy when interfaces_ips array has values and all required URLs are present', () => {
      mockConfigSignal.set({
        ...baseTncConfig,
        ips: [],
        interfaces_ips: ['10.0.0.1'],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeTruthy();
    });

    it('returns truthy when both ips and interfaces_ips arrays have values', () => {
      mockConfigSignal.set({
        ...baseTncConfig,
        ips: ['192.168.1.1'],
        interfaces_ips: ['10.0.0.1'],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeTruthy();
    });

    it('returns truthy when only interfaces_ips has values (backward compatibility)', () => {
      mockConfigSignal.set({
        ...baseTncConfig,
        ips: [],
        interfaces_ips: ['10.0.0.1', '10.0.0.2'],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeTruthy();
    });
  });
});
