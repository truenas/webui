import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  SpectatorService,
  createServiceFactory,
} from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { GlobalApiHttpService } from './global-api-http.service';

describe('GlobalApiHttpService', () => {
  let spectator: SpectatorService<GlobalApiHttpService>;
  let httpMock: HttpTestingController;

  const createService = createServiceFactory({
    service: GlobalApiHttpService,
    imports: [HttpClientTestingModule],
    providers: [
      mockWindow(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    httpMock = spectator.inject(HttpTestingController);
  });

  it('should call getBootId() and return string', async () => {
    const expectedBootId = 'boot-abc';

    const promise = firstValueFrom(spectator.service.getBootId());

    const req = httpMock.expectOne('/api/boot_id');
    expect(req.request.method).toBe('GET');
    req.flush(expectedBootId);

    const result = await promise;
    expect(result).toBe(expectedBootId);
  });
});
