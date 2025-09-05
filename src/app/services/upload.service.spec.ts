import { HttpClient, HttpResponse } from '@angular/common/http';
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
    it('sends a correct HTTP request when upload is called', () => {
      let capturedFormData: FormData | null = null;
      let capturedUrl = '';

      // Mock XMLHttpRequest to capture the request details
      const mockXhr = {
        upload: { addEventListener: jest.fn() },
        addEventListener: jest.fn(),
        open: jest.fn((_method: string, url: string) => {
          capturedUrl = url;
        }),
        send: jest.fn((data: FormData) => {
          capturedFormData = data;
        }),
        abort: jest.fn(),
      };

      const originalXhr = global.XMLHttpRequest;
      global.XMLHttpRequest = jest.fn(() => mockXhr) as unknown as typeof XMLHttpRequest;

      const { observable: observable$ } = spectator.service.upload(options);

      // Trigger the observable to start the request
      observable$.subscribe();

      // Verify XMLHttpRequest was configured correctly
      expect(mockXhr.open).toHaveBeenCalledWith('POST', expect.stringContaining('/_upload?auth_token='));
      expect(capturedUrl).toMatch('_upload');
      expect(mockXhr.send).toHaveBeenCalledWith(expect.any(FormData));

      // Verify FormData content
      expect(capturedFormData).toBeInstanceOf(FormData);
      expect(capturedFormData!.get('data')).toBe(JSON.stringify({
        method: options.method,
        params: options.params,
      }));
      expect(capturedFormData!.get('file')).toEqual(options.file);

      global.XMLHttpRequest = originalXhr;
    });
  });

  describe('uploadAsJob', () => {
    it('starts an upload and returns Job from the store', async () => {
      let capturedFormData: FormData | null = null;
      let capturedUrl = '';

      // Mock XMLHttpRequest to capture the request details
      const mockXhr = {
        upload: { addEventListener: jest.fn() },
        addEventListener: jest.fn(),
        open: jest.fn((_method: string, url: string) => {
          capturedUrl = url;
        }),
        send: jest.fn((data: FormData) => {
          capturedFormData = data;
          // Simulate successful response
          setTimeout(() => {
            mockXhr.status = 200;
            mockXhr.responseText = JSON.stringify({ job_id: 123 });
            const loadHandler = mockXhr.addEventListener.mock.calls.find((call) => call[0] === 'load')?.[1];
            if (loadHandler) loadHandler();
          }, 0);
        }),
        abort: jest.fn(),
        status: 200,
        responseText: '',
      };

      const originalXhr = global.XMLHttpRequest;
      global.XMLHttpRequest = jest.fn(() => mockXhr) as unknown as typeof XMLHttpRequest;

      const response = await firstValueFrom(spectator.service.uploadAsJob(options));

      // Verify XMLHttpRequest was configured correctly
      expect(mockXhr.open).toHaveBeenCalledWith('POST', expect.stringContaining('/_upload?auth_token='));
      expect(capturedUrl).toMatch('_upload');
      expect(mockXhr.send).toHaveBeenCalledWith(expect.any(FormData));

      // Verify FormData content
      expect(capturedFormData).toBeInstanceOf(FormData);
      expect(capturedFormData!.get('data')).toBe(JSON.stringify({
        method: options.method,
        params: options.params,
      }));
      expect(capturedFormData!.get('file')).toEqual(options.file);

      expect(spectator.inject(Store).select).toHaveBeenCalled();

      expect(response).toBe(job);

      global.XMLHttpRequest = originalXhr;
    });
  });
});
