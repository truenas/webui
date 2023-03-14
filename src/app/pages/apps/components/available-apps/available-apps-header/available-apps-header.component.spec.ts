import { ReactiveFormsModule } from '@angular/forms';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory } from '@ngneat/spectator/jest';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Catalog } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';

describe('AvailableAppsHeaderComponent', () => {
  let spectator: SpectatorRouting<AvailableAppsHeaderComponent>;

  const createComponent = createRoutingFactory({
    component: AvailableAppsHeaderComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('catalog.query', [{
          label: 'OFFICIAL',
          id: 'OFFICIAL',
          trains: {
            charts: {
              chia: {
                categories: ['storage', 'crypto'],
                last_update: '2023-03-01 13:26:19',
                name: 'chia',
              },
              qbittorent: {
                categories: ['media', 'torrent'],
                last_update: '2023-02-28 16:37:54',
                name: 'qbittorent',
              },
            },
          },
        }] as unknown as Catalog[]),
        mockCall('chart.release.query', [{}, {}, {}] as unknown as ChartRelease[]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks the displayed numbers', () => {
    const numbers = spectator.queryAll('.header-number h2');

    expect(numbers[0]).toHaveText('2'); // available apps
    expect(numbers[1]).toHaveText('3'); // installed Apps
    expect(numbers[2]).toHaveText('1'); // installed catalogs
  });
});
