import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { FailoverCardComponent } from 'app/pages/system/advanced/failover/failover-card.component';
import { FailoverFormComponent } from 'app/pages/system/advanced/failover/failover-form/failover-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('FailoverCardComponent', () => {
  let spectator: Spectator<FailoverCardComponent>;
  let loader: HarnessLoader;
  const fakeConfig = {
    disabled: false,
    master: true,
    timeout: 5,
  } as FailoverConfig;

  const createComponent = createComponentFactory({
    component: FailoverCardComponent,
    providers: [
      mockApi([
        mockCall('failover.config', fakeConfig),
      ]),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function getItemTexts(): Promise<string[]> {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    return parallel(() => items.map((item) => item.getFullText()));
  }

  it('displays the failover timeout but not the default controller when failover is enabled', async () => {
    expect(await getItemTexts()).toEqual([
      'Enabled: Yes',
      'Network Timeout Before Initiating Failover: 5s',
    ]);
  });

  it('displays the default controller but not the timeout when failover is disabled', async () => {
    spectator.inject(MockApiService).mockCall('failover.config', { ...fakeConfig, disabled: true });
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    expect(await getItemTexts()).toEqual([
      'Enabled: No',
      'Default Controller: Yes',
    ]);
  });

  it('opens FailoverFormComponent when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(FailoverFormComponent, { data: fakeConfig });
  });
});
