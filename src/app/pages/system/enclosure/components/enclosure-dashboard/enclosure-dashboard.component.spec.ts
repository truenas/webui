import { MatDialog } from '@angular/material/dialog';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureDashboardComponent', () => {
  let spectator: SpectatorRouting<EnclosureDashboardComponent>;
  const createComponent = createRoutingFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    declarations: [
      MockComponent(EmptyComponent),
    ],
    componentProviders: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: jest.fn(() => ({
          id: 'enclosure-id',
          name: 'M50',
          label: 'Current label',
        } as DashboardEnclosure)),
        initiate: jest.fn(),
        listenForDiskUpdates: jest.fn(() => of()),
        selectEnclosure: jest.fn(),
      }),
    ],
    providers: [
      mockWebSocket([
        mockCall('jbof.licensed', 5),
      ]),
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

  it('shows empty message for no selected enclosure selected', () => {
    spectator.inject(EnclosureStore, true).selectEnclosure.mockReturnValue(undefined);

    spectator.detectChanges();

    const visibleForm = spectator.query(EmptyComponent);
    expect(visibleForm).toExist();
  });
});
