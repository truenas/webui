import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { AuthService } from 'app/modules/auth/auth.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { getDefaultWidgets } from 'app/pages/dashboard/services/get-default-widgets';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
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
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
        ],
      }),
      mockTypedApi([
        mockTypedCall('auth.set_attribute', null),
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

  it('should handle save operation and its completion', async () => {
    const finalizeSpy = jest.spyOn(spectator.service, 'toggleLoadingState');

    spectator.service.save([{
      layout: WidgetGroupLayout.Full,
      slots: [
        { type: WidgetType.HostnameActive },
      ],
    },
    ]).subscribe();

    const api = spectator.inject(TypedApiService);
    expect(api.call).toHaveBeenCalledWith('auth.set_attribute', [
      'dashState',
      [{
        layout: WidgetGroupLayout.Full,
        slots: [
          { type: WidgetType.HostnameActive },
        ],
      }],
    ]);

    await new Promise<void>((resolve) => {
      setTimeout(resolve);
    });
    expect(finalizeSpy).toHaveBeenCalledWith(false);
  });

  it('should load demoWidgets if user does not have dashState', async () => {
    const authService = spectator.inject(AuthService);
    Object.defineProperty(authService, 'user$', { value: of({ attributes: {} }) });

    spectator.service.entered();

    expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
      ...initialState,
      groups: getDefaultWidgets(true),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
