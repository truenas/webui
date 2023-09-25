import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SessionsCardComponent } from 'app/pages/system/advanced/sessions/sessions-card/sessions-card.component';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('SessionsCardComponent', () => {
  let spectator: Spectator<SessionsCardComponent>;
  let loader: HarnessLoader;
  const sessions = Array.from({ length: 6 }).map((_, index) => (
    {
      id: `e8a2892e-f2a3-429e-bd9e-442db8fc948${index}`,
      current: true,
      internal: false,
      origin: '1.2.3.4:37170',
      credentials: 'TOKEN',
      credentials_data: {
        parent: {
          credentials: 'LOGIN_PASSWORD',
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
    component: SessionsCardComponent,
    imports: [AppLoaderModule, EntityModule, IxTable2Module, FakeFormatDateTimePipe],
    providers: [
      mockWebsocket([
        mockCall('auth.sessions', sessions),
        mockCall('auth.terminate_session'),
        mockCall('auth.terminate_other_sessions'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              lifetime: 60,
            },
          },
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: of(),
      }),
      mockProvider(AdvancedSettingsService),
      mockProvider(IxSlideInRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current token lifetime', async () => {
    const lifetime = await loader.getHarness(MatListItemHarness);
    expect(await lifetime.getFullText()).toBe('Token Lifetime: 1 minute');
  });

  it('opens Token settings form when Configure is pressed', async () => {
    const configure = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configure.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(TokenSettingsComponent);
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
      ['user-0', '2023-08-24 13:00:27', ''],
      ['user-1', '2023-08-24 13:00:27', ''],
      ['user-2', '2023-08-24 13:00:27', ''],
      ['user-3', '2023-08-24 13:00:27', ''],
      ['user-4', '2023-08-24 13:00:27', ''],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
