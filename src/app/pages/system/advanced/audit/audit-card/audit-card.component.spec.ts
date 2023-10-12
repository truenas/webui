import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AuditCardComponent } from 'app/pages/system/advanced/audit/audit-card/audit-card.component';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('AuditCardComponent', () => {
  let spectator: Spectator<AuditCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AuditCardComponent,
    imports: [
      CoreComponents,
    ],
    providers: [
      mockProvider(IxSlideInService, {
        onClose$: of(),
      }),
      mockWebsocket([
        mockCall('audit.config', {
          retention: 30,
          reservation: 100,
          quota: 100,
          quota_fill_warning: 80,
          quota_fill_critical: 95,
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows audit related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Retention: 30 days',
      'Reservation: 100 GiB',
      'Quota: 100 GiB',
      'Quota Fill Warning: 80%',
      'Quota Fill Critical: 95%',
    ]);
  });

  it('opens Audit form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AuditFormComponent);
  });
});
