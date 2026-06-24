import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { AuditCardComponent } from 'app/pages/system/advanced/audit/audit-card/audit-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('AuditCardComponent', () => {
  let spectator: Spectator<AuditCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AuditCardComponent,
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('audit.config', {
          retention: 30,
          reservation: 100,
          quota: 100,
          quota_fill_warning: 80,
          quota_fill_critical: 95,
        }),
      ]),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows audit related settings', () => {
    const rows = spectator.queryAll('.details-item');
    const itemTexts = rows.map((row) => row.textContent.replace(/\s+/g, ' ').trim());

    expect(itemTexts).toEqual([
      'Retention: 30 days',
      'Reservation: 100 GiB',
      'Quota: 100 GiB',
      'Quota Fill Warning: 80%',
      'Quota Fill Critical: 95%',
    ]);
  });

  it('opens the Audit form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Audit' },
    );
  });
});
