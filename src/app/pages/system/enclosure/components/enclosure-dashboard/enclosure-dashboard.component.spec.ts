import { MatDialog } from '@angular/material/dialog';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { WebSocketService } from 'app/services/ws.service';

describe('EnclosureDashboardComponent', () => {
  let spectator: SpectatorRouting<EnclosureDashboardComponent>;
  const createComponent = createRoutingFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    componentProviders: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => ({
          id: 'enclosure-id',
          name: 'M50',
          label: 'Current label',
        } as DashboardEnclosure),
        initiate: jest.fn(),
        selectEnclosure: jest.fn(),
      }),
    ],
    providers: [
      mockProvider(WebSocketService),
      // mockWebSocket([
      //   mockCall('jbof.licensed', 5),
      // ]),
      mockProvider(MatDialog),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('initializes store when component is initialized', () => {
    expect(spectator.inject(EnclosureStore, true).initiate).toHaveBeenCalled();
  });

  it('selects an enclosure when router param changes', () => {
    spectator.setRouteParam('enclosure', '123');

    expect(spectator.inject(EnclosureStore, true).selectEnclosure).toHaveBeenCalledWith('123');
  });
});
