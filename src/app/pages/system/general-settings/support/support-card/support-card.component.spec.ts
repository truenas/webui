import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo, SystemLicense } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import { SupportCardComponent } from 'app/pages/system/general-settings/support/support-card/support-card.component';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const systemInfo = {
  system_product: 'N7',
  datetime: { $date: 1666376171107 },
} as SystemInfo;

describe('SupportCardComponent', () => {
  let spectator: Spectator<SupportCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SupportCardComponent,
    imports: [
      ReactiveFormsModule,
      IxSlideToggleComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialog),
      mockProvider(DialogService),
      mockProvider(MatSnackBar),
      mockProvider(SlideIn),
      mockProvider(LocaleService, {
        getPreferredDateFormat: jest.fn(() => 'yyyy-MM-dd'),
      }),
      mockApi([
        mockCall('truenas.is_production', true),
        mockJob('truenas.set_production', fakeSuccessfulJob()),
        mockCall('system.product_type', ProductType.CommunityEdition),
        mockCall('support.is_available', true),
        mockCall('support.is_available_and_enabled', false),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: systemInfo,
          },
        ],
      }),
    ],
    declarations: [
      MockComponent(SysInfoComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('System with a license', () => {
    beforeEach(() => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectSystemInfo, {
        ...systemInfo,
        license: {
          features: [LicenseFeature.Jails],
          contract_end: {
            $type: 'date',
            $value: '2027-09-29',
          },
          addhw_detail: [] as unknown[],
        } as SystemLicense,
      });
      store$.refreshState();
      spectator.detectChanges();
    });

    describe('Proactive support availability', () => {
      it('checks if proactive support is available when license is present', () => {
        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('support.is_available');
      });

      it('sets isProactiveSupportAvailable signal to true when support is available', () => {
        expect(spectator.component.isProactiveSupportAvailable()).toBe(true);
      });

      it('sets isProactiveSupportAvailable signal to false when support is not available', () => {
        const api = spectator.inject(ApiService);
        jest.spyOn(api, 'call').mockReturnValue(of(false));

        spectator.component.ngOnInit();

        expect(spectator.component.isProactiveSupportAvailable()).toBe(false);
      });

      it('handles errors when checking proactive support availability', () => {
        spectator.component.isProactiveSupportAvailable.set(false);

        const api = spectator.inject(ApiService);
        jest.spyOn(api, 'call').mockImplementation((method: string) => {
          if (method === 'support.is_available') {
            return throwError(() => new Error('API error'));
          }
          return of(null);
        });

        const store$ = spectator.inject(MockStore);
        store$.refreshState();

        expect(spectator.component.isProactiveSupportAvailable()).toBe(false);
      });
    });

    describe('Proactive support banner', () => {
      it('shows proactive support banner when support is available but not enabled', () => {
        const banner = spectator.query('.support-banner.proactive');
        expect(banner).toExist();
      });

      it('has Enable button that opens ProactiveComponent', async () => {
        const slideIn = spectator.inject(SlideIn);
        jest.spyOn(slideIn, 'open');

        const enableButton = await loader.getHarness(MatButtonHarness.with({ text: 'Enable' }));
        await enableButton.click();

        expect(slideIn.open).toHaveBeenCalledWith(ProactiveComponent, { wide: true });
      });

      it('hides proactive support banner when enabled', () => {
        const api = spectator.inject(ApiService);
        jest.spyOn(api, 'call').mockImplementation((method: string) => {
          if (method === 'support.is_available_and_enabled') {
            return of(true);
          }
          return of(true);
        });

        spectator.component.ngOnInit();
        spectator.detectChanges();

        const banner = spectator.query('.support-banner.proactive');
        expect(banner).not.toExist();
      });
    });

    describe('Contract expiration warning banner', () => {
      beforeEach(() => {
        const store$ = spectator.inject(MockStore);
        store$.overrideSelector(selectSystemInfo, {
          ...systemInfo,
          datetime: { $date: 1767830400000 }, // 2026-01-08
          license: {
            features: [LicenseFeature.Jails],
            contract_end: {
              $type: 'date',
              $value: '2026-01-11',
            },
            addhw_detail: [] as unknown[],
          } as SystemLicense,
        });
        store$.refreshState();
        spectator.detectChanges();
      });

      it('shows warning banner when contract expires within 14 days', () => {
        const banner = spectator.query('.support-banner.warning');
        expect(banner).toExist();
      });

      it('has Contact Us link in warning banner', () => {
        const link = spectator.query('.support-banner.warning a');
        expect(link).toExist();
        expect(link).toHaveAttribute('href', 'https://www.truenas.com/contact-us/');
      });

      it('does not show warning banner when contract expires in more than 14 days', () => {
        const store$ = spectator.inject(MockStore);
        store$.overrideSelector(selectSystemInfo, {
          ...systemInfo,
          datetime: { $date: 1767830400000 }, // 2026-01-08
          license: {
            features: [LicenseFeature.Jails],
            contract_end: {
              $type: 'date',
              $value: '2026-02-01', // 24 days away
            },
            addhw_detail: [] as unknown[],
          } as SystemLicense,
        });
        store$.refreshState();
        spectator.detectChanges();

        const banner = spectator.query('.support-banner.warning');
        expect(banner).not.toExist();
      });
    });

    describe('Header action buttons', () => {
      it('opens FeedbackDialog when File Ticket button is clicked', async () => {
        const matDialog = spectator.inject(MatDialog);
        jest.spyOn(matDialog, 'open');

        const fileTicketButton = await loader.getHarness(MatButtonHarness.with({ text: 'File Ticket' }));
        await fileTicketButton.click();

        expect(matDialog.open).toHaveBeenCalledWith(FeedbackDialog, { data: FeedbackType.Bug });
      });

      it('opens LicenseComponent when Update License button is clicked', async () => {
        const slideIn = spectator.inject(SlideIn);
        jest.spyOn(slideIn, 'open');

        const updateLicenseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Update License' }));
        await updateLicenseButton.click();

        expect(slideIn.open).toHaveBeenCalledWith(LicenseComponent);
      });
    });
  });

  describe('System without a license', () => {
    beforeEach(() => {
      spectator.detectChanges();
    });

    it('shows community support banner', () => {
      const banner = spectator.query('.support-banner.community');
      expect(banner).toExist();
    });

    it('has link to forums in community banner', () => {
      const link = spectator.query('.support-banner.community a');
      expect(link).toExist();
      expect(link).toHaveAttribute('href', 'https://forums.truenas.com/');
    });

    it('does not show expiration warning banner', () => {
      const banner = spectator.query('.support-banner.warning');
      expect(banner).not.toExist();
    });
  });

  describe('Bronze license (proactive support not available)', () => {
    beforeEach(() => {
      const api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method: string) => {
        if (method === 'support.is_available') {
          return of(false);
        }
        return of(null);
      });

      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectSystemInfo, {
        ...systemInfo,
        license: {
          features: [LicenseFeature.Jails],
          contract_end: {
            $type: 'date',
            $value: '2027-09-29',
          },
          addhw_detail: [] as unknown[],
        } as SystemLicense,
      });
      store$.refreshState();
      spectator.detectChanges();
    });

    it('shows upsell banner for support options', () => {
      const banner = spectator.query('.support-banner.upsell');
      expect(banner).toExist();
    });

    it('has link to support page in upsell banner', () => {
      const link = spectator.query('.support-banner.upsell a');
      expect(link).toExist();
      expect(link).toHaveAttribute('href', 'https://www.truenas.com/support/');
    });

    it('does not show proactive support banner', () => {
      const banner = spectator.query('.support-banner.proactive');
      expect(banner).not.toExist();
    });
  });
});
