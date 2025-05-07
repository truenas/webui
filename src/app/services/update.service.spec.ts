import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalApiHttpService } from 'app/services/global-api-http.service';
import { UpdateService } from 'app/services/update.service';

describe('UpdateService', () => {
  let spectator: SpectatorService<UpdateService>;
  const bootId = 'boot-id-1';

  const createService = createServiceFactory({
    service: UpdateService,
    providers: [
      mockApi([
        mockCall('system.boot_id', 'boot-id-1'),
      ]),
      {
        provide: GlobalApiHttpService,
        useValue: {
          getBootId: jest.fn(() => of(bootId)),
        },
      },
      {
        provide: WINDOW,
        useValue: {
          location: {
            reload: jest.fn(),
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('compares boot id with last seen boot id and hard refreshes if there is a difference', () => {
    const window = spectator.inject<Window>(WINDOW);
    const globalApi = spectator.inject(GlobalApiHttpService);

    // First call (stores boot-id-1)
    spectator.service.hardRefreshIfNeeded().subscribe();

    // Second call (still boot-id-1, no reload)
    spectator.service.hardRefreshIfNeeded().subscribe();
    expect(window.location.reload).not.toHaveBeenCalled();

    // Change boot ID
    (globalApi.getBootId as jest.Mock).mockReturnValue(of('boot-id-2'));

    // Third call (boot-id changed, should reload)
    spectator.service.hardRefreshIfNeeded().subscribe();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
