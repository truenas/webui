import { HttpClient } from '@angular/common/http';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom, of } from 'rxjs';
import { SvgCacheService } from './svg-cache.service';

describe('SvgCacheService', () => {
  let spectator: SpectatorService<SvgCacheService>;
  const testSvg = '<svg></svg>';
  const createService = createServiceFactory({
    service: SvgCacheService,
    providers: [
      mockProvider(HttpClient, {
        get: jest.fn(() => of(testSvg)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should load SVG from URL and cache it', async () => {
    const testUrl = 'http://test.com/test.svg';
    const client = spectator.inject(HttpClient);

    const svg = await lastValueFrom(spectator.service.loadSvg(testUrl));
    expect(svg).toEqual(testSvg);

    expect(client.get).toHaveBeenCalledWith(testUrl, { responseType: 'text' });
    expect(client.get).toHaveBeenCalledTimes(1);

    // Test caching
    const svg2 = await lastValueFrom(spectator.service.loadSvg(testUrl));
    expect(svg2).toEqual(testSvg);

    expect(client.get).toHaveBeenCalledTimes(1);
  });
});
