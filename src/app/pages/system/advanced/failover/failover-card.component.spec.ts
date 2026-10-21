import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FailoverCardComponent } from 'app/pages/system/advanced/failover/failover-card.component';
import { FailoverFormComponent } from 'app/pages/system/advanced/failover/failover-form/failover-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('FailoverCardComponent', () => {
  let spectator: Spectator<FailoverCardComponent>;
  let loader: HarnessLoader;
  let formPanel: FormSidePanelService;
  const fakeConfig = {
    disabled: false,
    master: true,
    timeout: 5,
  } as FailoverConfig;

  const createComponent = createComponentFactory({
    component: FailoverCardComponent,
    providers: [
      mockTypedApi([
        mockTypedCall('failover.config', fakeConfig),
        mockTypedCall('failover.update', null),
        mockTypedCall('failover.sync_to_peer', null),
        mockTypedCall('failover.sync_from_peer', null),
      ]),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$: of(true),
      }),
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    formPanel = spectator.inject(FormSidePanelService);
  });

  function getItemTexts(): string[] {
    return spectator.queryAll('.details-item').map((item) => item.textContent.replace(/\s+/g, ' ').trim());
  }

  it('displays the failover timeout but not the default controller when failover is enabled', () => {
    expect(getItemTexts()).toEqual([
      'Enabled: Yes',
      'Network Timeout Before Initiating Failover: 5s',
    ]);
  });

  it('displays the default controller but not the timeout when failover is disabled', async () => {
    spectator.inject(MockTypedApiService).mockCall('failover.config', { ...fakeConfig, disabled: true });
    spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(getItemTexts()).toEqual([
      'Enabled: No',
      'Default Controller: Yes',
    ]);
  });

  it('opens the Failover form in a side panel when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(formPanel.open).toHaveBeenCalledWith(FailoverFormComponent, { title: 'Failover' });
  });
});
