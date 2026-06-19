import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnIconHarness, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AccessCardComponent } from 'app/pages/system/advanced/access/access-card/access-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { SystemGeneralService } from 'app/services/system-general.service';
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
        mockCall('system.general.update'),
        mockCall('system.advanced.update'),
      ]),
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: null,
            productType: ProductType.Enterprise,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
        selectors: [
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
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(SystemGeneralService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows whether DS users are allowed access to WebUI', () => {
    const allowed = spectator.queryAll('.details-item')[0];
    expect(allowed.textContent.replace(/\s+/g, ' ').trim()).toBe('Allow Directory Service users to access WebUI: Yes');
  });

  it('shows current login banner', () => {
    const loginBanner = spectator.queryAll('.details-item')[1];
    expect(loginBanner.textContent.replace(/\s+/g, ' ').trim()).toBe('Login Banner: Hello World!');
  });

  it('opens the Access settings form in a side panel when Configure is pressed', async () => {
    expect(spectator.query('ix-access-form')).toBeNull();

    const configure = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configure.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-access-form')).not.toBeNull();
  });

  it('terminates the session when corresponding Terminate is pressed', async () => {
    const terminateButton = await loader.getHarness(TnIconHarness.with({ name: 'mdi-exit-to-app' }));
    await terminateButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Terminate session',
      message: 'Are you sure you want to terminate the session?',
    });
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.terminate_session', ['e8a2892e-f2a3-429e-bd9e-442db8fc9480']);
  });

  it('terminates other sessions when corresponding Terminate Other Sessions is pressed', async () => {
    const terminateButton = await loader.getHarness(TnButtonHarness.with({ label: 'Terminate Other Sessions' }));
    await terminateButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.terminate_other_sessions');
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['user-0', '2023-08-24 03:00:27', ''],
      ['user-1', '2023-08-24 03:00:27', ''],
      ['user-2', '2023-08-24 03:00:27', ''],
      ['user-3', '2023-08-24 03:00:27', ''],
      ['user-4', '2023-08-24 03:00:27', ''],
    ];

    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getHeaderTexts()).toEqual(['Username', 'Start session time', '']);
    expect(await table.getAllRowTexts()).toEqual(expectedRows);
  });
});
