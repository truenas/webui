import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { EulaComponent } from 'app/pages/system/general-settings/support/eula/eula.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('EulaComponent', () => {
  let spectator: Spectator<EulaComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: EulaComponent,
    providers: [
      provideRouter([]),
      mockApi([
        mockCall('truenas.get_eula', '<p>License terms</p>'),
      ]),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: () => (source$: unknown) => source$,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads the EULA and shows its text', () => {
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.get_eula');
    expect(spectator.query('#eula')).toHaveText('License terms');
  });

  it('shows a Back to Support button with the loaded EULA', async () => {
    const backButton = await loader.getHarness(TnButtonHarness.with({ label: 'Back to Support' }));
    expect(backButton).toBeTruthy();
  });
});
