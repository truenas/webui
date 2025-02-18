import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { CheckinIndicatorComponent } from 'app/modules/layout/topbar/checkin-indicator/checkin-indicator.component';
import {
  DirectoryServicesIndicatorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-indicator.component';
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

  const createComponent = createComponentFactory({
    component: TopbarComponent,
    declarations: [
      MockComponents(
        CheckinIndicatorComponent,
        DirectoryServicesIndicatorComponent,
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
        updateRunning: new EventEmitter<unknown>(),
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
        config: () => ({}),
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
                arguments: [],
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
});
