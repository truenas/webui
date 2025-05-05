import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  SpectatorService,
  createServiceFactory,
} from '@ngneat/spectator/jest';
import { environment } from 'environments/environment';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalApiHttpService } from './global-api-http.service';

describe('GlobalApiHttpService', () => {
  let spectator: SpectatorService<GlobalApiHttpService>;
  let httpMock: HttpTestingController;

  const mockWindow = {
    location: {
      protocol: 'https:',
    },
  } as unknown as Window;

  const createService = createServiceFactory({
    service: GlobalApiHttpService,
    imports: [HttpClientTestingModule],
    providers: [
      { provide: WINDOW, useValue: mockWindow },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    httpMock = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should call getBootId() and return string', () => {
    const expectedBootId = 'boot-abc';

    spectator.service.getBootId().subscribe((result) => {
      expect(result).toBe(expectedBootId);
    });

    const req = httpMock.expectOne(`https://${environment.remote}/api/boot_id`);
    expect(req.request.method).toBe('GET');
    req.flush(expectedBootId);
  });
});
