import { HttpClient, HttpRequest, HttpResponse } from '@angular/common/http';
import {
  createServiceFactory, SpectatorService, mockProvider, SpyObject,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { firstValueFrom, of } from 'rxjs';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { UploadService } from 'app/services/upload.service';

describe('UploadService', () => {
  let spectator: SpectatorService<UploadService>;
  let httpClientMock: SpyObject<HttpClient>;

  const job = {} as Job;

  const createService = createServiceFactory({
    service: UploadService,
    providers: [
      mockProvider(HttpClient),
      mockProvider(Store, {
        select: jest.fn(() => of(job)),
      }),
      mockProvider(AuthService, {
        getOneTimeToken: jest.fn(() => of('token')),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    httpClientMock = spectator.inject(HttpClient);
    httpClientMock.request.mockReturnValue(of(new HttpResponse({ body: { job_id: 1 } })));
  });

  const options = {
    file: new File([''], 'file.txt'),
    method: 'filesystem.put' as ApiJobMethod,
    params: ['somePath', { mode: 493 }],
  };

  describe('upload', () => {
    it('sends a correct HTTP request when upload is called', async () => {
      await firstValueFrom(spectator.service.upload(options));

      const request = httpClientMock.request.mock.calls[0][0] as unknown as HttpRequest<FormData>;
      expect(request).toBeInstanceOf(HttpRequest);
      expect(request.method).toBe('POST');
      expect(request.url).toMatch('_upload');
      expect(request.body).toBeInstanceOf(FormData);
      expect(request.body!.get('data')).toBe(JSON.stringify({
        method: options.method,
        params: options.params,
      }));
      expect(request.body!.get('file')).toEqual(options.file);
    });
  });

  describe('uploadAsJob', () => {
    it('starts an upload and returns Job from the store', async () => {
      const response = await firstValueFrom(spectator.service.uploadAsJob(options));

      const request = httpClientMock.request.mock.calls[0][0] as unknown as HttpRequest<FormData>;
      expect(request).toBeInstanceOf(HttpRequest);
      expect(request.method).toBe('POST');
      expect(request.url).toMatch('_upload');
      expect(request.body).toBeInstanceOf(FormData);
      expect(request.body!.get('data')).toBe(JSON.stringify({
        method: options.method,
        params: options.params,
      }));
      expect(request.body!.get('file')).toEqual(options.file);

      expect(spectator.inject(Store).select).toHaveBeenCalled();

      expect(response).toBe(job);
    });
  });
});
