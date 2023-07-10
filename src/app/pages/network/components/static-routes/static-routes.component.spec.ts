import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { StaticRoutesComponent } from 'app/pages/network/components/static-routes/static-routes.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('StaticRoutesComponent', () => {
  let spectator: Spectator<StaticRoutesComponent>;

  const createComponent = createComponentFactory({
    component: StaticRoutesComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('staticroute.query', []),
        mockCall('staticroute.delete'),
      ]),
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
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Static Routes');
  });
});
