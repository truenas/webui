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
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/enclosure-dashboard.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureDashboardComponent', () => {
  let spectator: SpectatorRouting<EnclosureDashboardComponent>;
  const createComponent = createRoutingFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    declarations: [
      MockComponent(EmptyComponent),
      MockComponent(PageHeaderComponent),
    ],
    componentProviders: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: jest.fn(),
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

  it('shows empty message when no enclosure is available', () => {
    spectator.inject(EnclosureStore, true).selectedEnclosure.mockReturnValueOnce(undefined);

    spectator.detectChanges();

    const emptyComponent = spectator.query(EmptyComponent);
    expect(emptyComponent).toExist();
  });

  it('initializes store when component is initialized', () => {
    expect(spectator.inject(EnclosureStore, true).initiate).toHaveBeenCalled();
  });

  it('selects an enclosure when router param changes', () => {
    spectator.setRouteParam('enclosure', '123');

    expect(spectator.inject(EnclosureStore, true).selectEnclosure).toHaveBeenCalledWith('123');
  });
});
