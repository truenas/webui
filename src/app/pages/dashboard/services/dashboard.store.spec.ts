import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import { filter, firstValueFrom, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
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

/** An `auth.me` answer carrying only the account attributes the store reads. */
function authMe(attributes: Record<string, unknown>): CallResponse<WebUiApiDirectory, 'auth.me'> {
  return { attributes } as unknown as CallResponse<WebUiApiDirectory, 'auth.me'>;
}

describe('DashboardStore', () => {
  let spectator: SpectatorService<DashboardStore>;
  const createService = createServiceFactory({
    service: DashboardStore,
    providers: [
      mockProvider(AuthService, {
        refreshUser: jest.fn(() => of(null)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
        ],
      }),
      mockApi([
        mockCall('auth.set_attribute', null),
        mockCall('auth.me', authMe({ dashState: initialGroups })),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  /** The state once the last `entered()` has finished loading, since `auth.me` answers asynchronously. */
  function loadedState(): Promise<typeof initialState> {
    return firstValueFrom(spectator.service.state$.pipe(filter((state) => !state.isLoading)));
  }

  it('correctly initializes dashboard store and converts old dashboard widgets to new ones', async () => {
    expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
      ...initialState,
    });

    spectator.service.entered();

    expect(await loadedState()).toMatchObject({
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

    const api = spectator.inject(ApiService);
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

  it('keeps the saved layout, so cancelling the next edit does not bring back the one before', async () => {
    spectator.service.entered();
    await loadedState();
    const saved = [{ layout: WidgetGroupLayout.Full, slots: [{ type: WidgetType.Cpu }] }];

    await firstValueFrom(spectator.service.save(saved));

    expect(await firstValueFrom(spectator.service.groups$)).toEqual(saved);
  });

  it('should load demoWidgets if user does not have dashState', async () => {
    spectator.inject(MockApiService).mockCall('auth.me', authMe({}));

    spectator.service.entered();

    expect(await loadedState()).toMatchObject({
      ...initialState,
      groups: getDefaultWidgets(true),
    });
  });

  it('reads the layout from the server on every entry, not the one cached at sign-in', async () => {
    spectator.service.entered();
    await loadedState();
    spectator.inject(MockApiService).mockCall('auth.me', authMe({
      dashState: [{ layout: WidgetGroupLayout.Full, slots: [{ type: WidgetType.Cpu }] }],
    }));

    spectator.service.entered();

    expect(await loadedState()).toMatchObject({
      groups: [{ layout: WidgetGroupLayout.Full, slots: [{ type: WidgetType.Cpu }] }],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
