import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AccessCardComponent } from 'app/pages/system/advanced/access/access-card/access-card.component';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

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
    imports: [AppLoaderModule, IxTableModule, FakeFormatDateTimePipe],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockWebSocket([
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
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(AdvancedSettingsService, {
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

  it('shows current token lifetime', async () => {
    const lifetime = (await loader.getAllHarnesses(MatListItemHarness))[0];
    expect(await lifetime.getFullText()).toBe('Token Lifetime: 24 days 20 hours 31 minutes 22 seconds');
  });

  it('shows whether DS users are allowed access to WebUI', async () => {
    const allowed = (await loader.getAllHarnesses(MatListItemHarness))[1];
    expect(await allowed.getFullText()).toBe('Allow Directory Service users to access WebUI: Yes');
  });

  it('opens Token settings form when Configure is pressed', async () => {
    const configure = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configure.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxChainedSlideInService).open).toHaveBeenCalledWith(AccessFormComponent);
  });

  it('terminates the session when corresponding Terminate is pressed', async () => {
    const terminateButton = await loader.getHarness(IxIconHarness.with({ name: 'exit_to_app' }));
    await terminateButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Terminate session',
      message: 'Are you sure you want to terminate the session?',
    });
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('auth.terminate_session', ['e8a2892e-f2a3-429e-bd9e-442db8fc9480']);
  });

  it('terminates other sessions when corresponding Terminate Other Sessions is pressed', async () => {
    const terminateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Terminate Other Sessions' }));
    await terminateButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('auth.terminate_other_sessions');
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
