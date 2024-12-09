import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { AccessCardComponent } from 'app/pages/system/advanced/access/access-card/access-card.component';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { LocaleService } from 'app/services/locale.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ApiService } from 'app/services/websocket/api.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectAdvancedConfig, selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('AccessCardComponent', () => {
  let spectator: Spectator<AccessCardComponent>;
  let loader: HarnessLoader;
  const sessions = Array.from({ length: 6 }).map((_, index) => (
    {
      id: `e8a2892e-f2a3-429e-bd9e-442db8fc948${index}`,
      current: true,
      internal: false,
      origin: '1.2.3.4:37170',
      credentials: CredentialType.Token,
      credentials_data: {
        parent: {
          credentials: CredentialType.LoginPassword,
          credentials_data: {
            username: `user-${index}`,
          },
        },
      },
      created_at: {
        $date: 1692871227000,
      },
    }));
  const createComponent = createComponentFactory({
    component: AccessCardComponent,
    imports: [
      FakeFormatDateTimePipe,
      YesNoPipe,
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockApi([
        mockCall('auth.sessions', sessions),
        mockCall('auth.terminate_session'),
        mockCall('auth.terminate_other_sessions'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              lifetime: 2147482,
            },
          },
          {
            selector: selectGeneralConfig,
            value: {
              ds_auth: true,
            },
          },
          {
            selector: selectAdvancedConfig,
            value: {
              login_banner: 'Hello World!',
            },
          },
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(ChainedRef),
      mockProvider(SystemGeneralService, {
        isEnterprise: jest.fn(() => true),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current Session Timeout', async () => {
    const lifetime = (await loader.getAllHarnesses(MatListItemHarness))[0];
    expect(await lifetime.getFullText()).toBe('Session Timeout: 24 days 20 hours 31 minutes 22 seconds');
  });

  it('shows whether DS users are allowed access to WebUI', async () => {
    const allowed = (await loader.getAllHarnesses(MatListItemHarness))[1];
    expect(await allowed.getFullText()).toBe('Allow Directory Service users to access WebUI: Yes');
  });

  it('shows current login banner', async () => {
    const loginBanner = (await loader.getAllHarnesses(MatListItemHarness))[2];
    expect(await loginBanner.getFullText()).toBe('Login Banner: Hello World!');
  });

  it('opens Token settings form when Configure is pressed', async () => {
    const configure = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configure.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(AccessFormComponent);
  });

  it('terminates the session when corresponding Terminate is pressed', async () => {
    const terminateButton = await loader.getHarness(IxIconHarness.with({ name: 'exit_to_app' }));
    await terminateButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Terminate session',
      message: 'Are you sure you want to terminate the session?',
    });
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.terminate_session', ['e8a2892e-f2a3-429e-bd9e-442db8fc9480']);
  });

  it('terminates other sessions when corresponding Terminate Other Sessions is pressed', async () => {
    const terminateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Terminate Other Sessions' }));
    await terminateButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.terminate_other_sessions');
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Username', 'Start session time', ''],
      ['user-0', '2023-08-24 03:00:27', ''],
      ['user-1', '2023-08-24 03:00:27', ''],
      ['user-2', '2023-08-24 03:00:27', ''],
      ['user-3', '2023-08-24 03:00:27', ''],
      ['user-4', '2023-08-24 03:00:27', ''],
    ];

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
