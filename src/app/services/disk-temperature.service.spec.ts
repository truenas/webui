import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureElements, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';

describe('DiskTemperatureService', () => {
  let spectator: SpectatorService<DiskTemperatureService>;
  let api: MockApiService;

  const createService = createServiceFactory({
    service: DiskTemperatureService,
    providers: [
      mockApi([
        mockCall('disk.temperatures'),
        mockCall('webui.enclosure.dashboard', [
          {
            elements: {
              [EnclosureElementType.ArrayDeviceSlot]: {
                0: {
                  dev: 'ada1',
                } as DashboardEnclosureSlot,
              },
            } as DashboardEnclosureElements,
          },
        ] as DashboardEnclosure[]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(MockApiService);
  });

  it('checks if getTemperature made websocket calls"', async () => {
    await firstValueFrom(spectator.service.getTemperature());
    expect(api.call).toHaveBeenCalledWith('webui.enclosure.dashboard');
    expect(api.call).toHaveBeenCalledWith('disk.temperatures', [['ada1']]);
  });
});
