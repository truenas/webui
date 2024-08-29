import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { defaultWidgets } from 'app/pages/dashboard/services/demo-widgets.constant';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';
import { DashboardStore, initialState } from './dashboard.store';

const initialGroups = [
  {
    name: 'Help',
    rendered: true,
  },
  {
    layout: WidgetGroupLayout.Halves,
    slots: [
      { type: WidgetType.Memory },
      { type: WidgetType.Ipv4Address },
    ],
  },
];

describe('DashboardStore', () => {
  let spectator: SpectatorService<DashboardStore>;
  const createService = createServiceFactory({
    service: DashboardStore,
    providers: [
      mockProvider(AuthService, {
        refreshUser: jest.fn(() => of(null)),
        user$: of({
          attributes: {
            dashState: initialGroups,
          },
        }),
      }),
      mockWebSocket([
        mockCall('auth.set_attribute'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('correctly initializes dashboard store and converts old dashboard widgets to new ones', async () => {
    expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
      ...initialState,
    });

    spectator.service.entered();

    expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
      ...initialState,
      groups: [
        {
          layout: WidgetGroupLayout.Full,
          slots: [
            { type: WidgetType.Help },
          ],
        },
        {
          layout: WidgetGroupLayout.Halves,
          slots: [
            { type: WidgetType.Memory },
            { type: WidgetType.Ipv4Address },
          ],
        },
      ],
    });
  });

  it('should handle save operation and its completion', () => {
    const finalizeSpy = jest.spyOn(spectator.service, 'toggleLoadingState');

    spectator.service.save([{
      layout: WidgetGroupLayout.Full,
      slots: [
        { type: WidgetType.HostnameActive },
      ],
    },
    ]).subscribe();

    const websocket = spectator.inject(WebSocketService);
    expect(websocket.call).toHaveBeenCalledWith('auth.set_attribute', [
      'dashState',
      [{
        layout: WidgetGroupLayout.Full,
        slots: [
          { type: WidgetType.HostnameActive },
        ],
      }],
    ]);

    expect(finalizeSpy).toHaveBeenCalledWith(false);
  });

  it('should load defaultWidgets if user does not have dashState', async () => {
    const authService = spectator.inject(AuthService);
    Object.defineProperty(authService, 'user$', { value: of({ attributes: {} }) });

    spectator.service.entered();

    expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
      ...initialState,
      groups: defaultWidgets,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
