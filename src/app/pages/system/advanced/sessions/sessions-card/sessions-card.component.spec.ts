import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { SessionsCardComponent } from 'app/pages/system/advanced/sessions/sessions-card/sessions-card.component';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('SessionsCardComponent', () => {
  let spectator: Spectator<SessionsCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SessionsCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('auth.terminate_other_sessions'),
        mockCall('auth.sessions', []),
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
        confirm: () => of(true),
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
    expect(await lifetime.getFullText()).toBe('Token Lifetime: 60');
  });

  it('opens Token settings form when Configure is pressed', async () => {
    const configure = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configure.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(TokenSettingsComponent);
  });

  it('terminates other sessions when corresponding Terminate Other Sessions is pressed', async () => {
    const terminateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Terminate Other Sessions' }));
    await terminateButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('auth.terminate_other_sessions');
  });
});
