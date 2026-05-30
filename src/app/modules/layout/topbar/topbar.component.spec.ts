import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnIconButtonComponent, TnIconButtonHarness, TnIconComponent, TnIconHarness, TnSpriteLoaderService,
} from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { selectImportantUnreadAlertsCount, selectIsAlertPanelOpen, selectTopAlertSeverity } from 'app/modules/alerts/store/alert.selectors';
import { UpdateDialog } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { selectUpdateJobs } from 'app/modules/jobs/store/job.selectors';
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

interface ComponentOptions {
  updateJob?: Job[];
  updateRunningStatus$?: EventEmitter<'true' | 'false'>;
  matDialog?: Partial<MatDialog>;
}

function createTopbarComponent(options: ComponentOptions = {}): {
  factory: () => Spectator<TopbarComponent>;
  mockConfigSignal: ReturnType<typeof signal<TruenasConnectConfig | null>>;
} {
  const {
    updateJob = [
      {
        state: JobState.Running,
        arguments: [] as unknown[],
      } as Job,
    ],
    updateRunningStatus$ = new EventEmitter<'true' | 'false'>(),
    matDialog = {
      open: jest.fn(() => ({
        componentInstance: {
          setMessage: jest.fn(),
        },
        afterClosed: () => of({}),
      })),
    },
  } = options;

  const mockConfigSignal = signal<TruenasConnectConfig | null>(null);

  const factory = createComponentFactory({
    component: TopbarComponent,
    imports: [
      TnIconComponent,
    ],
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
      mockProvider(MatDialog, matDialog),
      mockApi([]),
      mockProvider(TruenasConnectService, {
        config: mockConfigSignal,
      }),
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: null,
            productType: ProductType.CommunityEdition,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
        selectors: [
          {
            selector: selectRebootInfo,
            value: fakeRebootInfo,
          },
          {
            selector: selectUpdateJobs,
            value: updateJob,
          },
          {
            selector: selectGeneralConfig,
            value: {},
          },
          {
            selector: selectImportantUnreadAlertsCount,
            value: 0,
          },
          {
            selector: selectIsAlertPanelOpen,
            value: false,
          },
          {
            selector: selectTopAlertSeverity,
            value: null,
          },
        ],
      }),
    ],
  });

  return { factory, mockConfigSignal };
}

describe('TopbarComponent', () => {
  let spectator: Spectator<TopbarComponent>;
  let loader: HarnessLoader;
  let mockConfigSignal: ReturnType<typeof signal<TruenasConnectConfig | null>>;
  const updateRunningStatus$ = new EventEmitter<'true' | 'false'>();

  const { factory: createComponent, mockConfigSignal: configSignal } = createTopbarComponent({
    updateRunningStatus$,
  });

  beforeEach(() => {
    mockConfigSignal = configSignal;
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Reboot Info button', async () => {
    const rebootInfoButton = await loader.getHarnessOrNull(
      TnIconButtonHarness.with({ name: 'update' }),
    );
    expect(rebootInfoButton).not.toBeNull();
  });

  describe('update icon', () => {
    it('shows an icon when there is an active update job', async () => {
      const icon = await loader.getHarness(TnIconHarness.with({ name: 'download' }));
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

    it('returns truthy when all required URLs are present (regardless of IP configuration)', () => {
      mockConfigSignal.set({
        ...baseTncConfig,
        ips: [],
        interfaces_ips: [],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeTruthy();
    });

    it('returns falsy when missing required URLs', () => {
      mockConfigSignal.set({
        ips: ['192.168.1.1'],
        interfaces_ips: [],
        tnc_base_url: '',
        account_service_base_url: '',
        leca_service_base_url: '',
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });

    it('returns falsy when tnc_base_url is missing', () => {
      mockConfigSignal.set({
        account_service_base_url: 'https://account.example.com',
        leca_service_base_url: 'https://leca.example.com',
        ips: [],
        interfaces_ips: [],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });

    it('returns falsy when account_service_base_url is missing', () => {
      mockConfigSignal.set({
        tnc_base_url: 'https://tnc.example.com',
        leca_service_base_url: 'https://leca.example.com',
        ips: [],
        interfaces_ips: [],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });

    it('returns falsy when leca_service_base_url is missing', () => {
      mockConfigSignal.set({
        tnc_base_url: 'https://tnc.example.com',
        account_service_base_url: 'https://account.example.com',
        ips: [],
        interfaces_ips: [],
      } as TruenasConnectConfig);
      expect(spectator.component.hasTncConfig()).toBeFalsy();
    });
  });

  describe('feedback button', () => {
    it('should not be disabled', async () => {
      const feedbackButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'emoticon' }));
      expect(await feedbackButton.isDisabled()).toBe(false);
    });
  });

  describe('alert severity', () => {
    function setSeverity(severity: 'critical' | 'warning' | null): void {
      spectator.inject(MockStore).overrideSelector(selectTopAlertSeverity, severity);
      spectator.inject(MockStore).refreshState();
      spectator.detectChanges();
    }

    it('applies alert-critical class to bell icon when severity is critical', async () => {
      setSeverity('critical');

      const bellIcon = await loader.getHarness(TnIconHarness.with({ name: 'bell' }));
      const host = await bellIcon.host();
      expect(await host.hasClass('alert-critical')).toBe(true);
    });

    it('applies alert-warning class to bell icon when severity is warning', async () => {
      setSeverity('warning');

      const bellIcon = await loader.getHarness(TnIconHarness.with({ name: 'bell' }));
      const host = await bellIcon.host();
      expect(await host.hasClass('alert-warning')).toBe(true);
    });

    it('does not apply severity class to bell icon when severity is null', async () => {
      const bellIcon = await loader.getHarness(TnIconHarness.with({ name: 'bell' }));
      const host = await bellIcon.host();
      expect(await host.hasClass('alert-critical')).toBe(false);
      expect(await host.hasClass('alert-warning')).toBe(false);
    });

    it('applies severity-critical class to alert button when severity is critical', async () => {
      setSeverity('critical');

      const alertButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'bell' }));
      const host = await alertButton.host();
      expect(await host.hasClass('severity-critical')).toBe(true);
    });

    it('applies severity-warning class to alert button when severity is warning', async () => {
      setSeverity('warning');

      const alertButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'bell' }));
      const host = await alertButton.host();
      expect(await host.hasClass('severity-warning')).toBe(true);
    });

    // The bell's tooltip and aria-label are both bound to the same alertTooltip()
    // computed, and TnIconButtonHarness exposes no tooltip getter, so asserting the
    // aria-label here also covers the tooltip text.
    it('updates aria-label on alert button when severity is critical', () => {
      setSeverity('critical');

      expect(spectator.query('[aria-label="Alerts - Critical alerts present"]')).not.toBeNull();
    });

    it('updates aria-label on alert button when severity is warning', () => {
      setSeverity('warning');

      expect(spectator.query('[aria-label="Alerts - Warnings present"]')).not.toBeNull();
    });
  });

  describe('focusAlertIndicator', () => {
    // Guards against TnIconButtonComponent losing its public `focus()` method
    // in a future library version — the call site uses `?.` and would silently
    // become a no-op, breaking keyboard focus restoration after the alert
    // panel closes.
    it('focuses the alert indicator button via the library component', () => {
      // `alertIndicator` is a private viewChild; reach it through a permissive
      // type rather than bracket access to satisfy @typescript-eslint/dot-notation.
      const indicator = (spectator.component as unknown as {
        alertIndicator: () => TnIconButtonComponent | undefined;
      }).alertIndicator();
      expect(indicator).toBeDefined();
      const focusSpy = jest.spyOn(indicator!, 'focus');

      spectator.component.focusAlertIndicator();

      expect(focusSpy).toHaveBeenCalled();
    });
  });
});
