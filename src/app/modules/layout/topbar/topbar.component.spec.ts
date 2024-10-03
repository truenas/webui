import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents, MockModule } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { CheckinIndicatorComponent } from 'app/modules/layout/topbar/checkin-indicator/checkin-indicator.component';
import { DirectoryServicesIndicatorComponent } from 'app/modules/layout/topbar/directory-services-indicator/directory-services-indicator.component';
import { IxLogoComponent } from 'app/modules/layout/topbar/ix-logo/ix-logo.component';
import { JobsIndicatorComponent } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { TopbarComponent } from 'app/modules/layout/topbar/topbar.component';
import { UserMenuComponent } from 'app/modules/layout/topbar/user-menu/user-menu.component';
import { TruecommandModule } from 'app/modules/truecommand/truecommand.module';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
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
        IxLogoComponent,
        IxIconComponent,
        CheckinIndicatorComponent,
        DirectoryServicesIndicatorComponent,
        JobsIndicatorComponent,
        UserMenuComponent,
        PowerMenuComponent,
      ),
      MockModule(TruecommandModule),
    ],
    providers: [
      mockAuth(),
      mockWebSocket([]),
      mockProvider(ThemeService),
      mockProvider(SystemGeneralService, {
        updateRunningNoticeSent: new EventEmitter<string>(),
      }),
      mockProvider(UiSearchProvider),
      mockProvider(MatDialog),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectHaStatus,
            value: {
              hasHa: true,
              reasons: [
                FailoverDisabledReason.LocalFipsRebootRequired,
                FailoverDisabledReason.RemoteFipsRebootRequired,
              ],
            } as HaStatus,
          },
          {
            selector: selectRebootInfo,
            value: fakeRebootInfo,
          },
          {
            selector: selectUpdateJob,
            value: [],
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
});
