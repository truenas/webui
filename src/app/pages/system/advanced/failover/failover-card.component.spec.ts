import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
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

  it('displays failover configuration', () => {
    const items = spectator.queryAll('.details-item');
    const itemTexts = items.map((item) => item.textContent.replace(/\s+/g, ' ').trim());

    expect(itemTexts).toEqual([
      'Enabled: Yes',
      'Default Controller: Yes',
      'Network Timeout Before Initiating Failover: 5s',
    ]);
  });

  it('opens the Failover form in a side panel when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(formPanel.open).toHaveBeenCalledWith(FailoverFormComponent, { title: 'Failover' });
  });
});
