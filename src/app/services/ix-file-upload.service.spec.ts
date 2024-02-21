import { HttpClient, HttpResponse } from '@angular/common/http';
import {
  createServiceFactory, SpectatorService, mockProvider, SpyObject,
} from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { IxFileUploadService } from './ix-file-upload.service';

describe('IxFileUploadService', () => {
  let spectator: SpectatorService<IxFileUploadService>;
  let httpClientMock: SpyObject<HttpClient>;

  const createService = createServiceFactory({
    service: IxFileUploadService,
    providers: [
      mockProvider(HttpClient),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    httpClientMock = spectator.inject(HttpClient);
  });

  it('sends a correct HTTP request when upload is called', () => {
    const mockFile = new File(['content'], 'test.txt');
    const method = 'filesystem.put';
    const params = ['somePath', { mode: 493 }];

    spectator.service.upload(mockFile, method, params).subscribe((response) => {
      expect(spectator.service.upload).toHaveBeenCalledWith(mockFile, 'filesystem.put', ['somePath', { mode: 493 }]);

      expect(httpClientMock.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('_upload'),
          body: mockFile,
        }),
      );

      expect(response).toBeInstanceOf(HttpResponse);
    });
  });

  it('handles HTTP errors correctly', () => {
    const mockFile = new File(['content'], 'test.txt');
    const method = 'filesystem.put';
    const params = ['somePath', { mode: 493 }];

    httpClientMock.request.mockReturnValue(throwError(new Error('Failed to upload')));

    spectator.service.upload(mockFile, method, params).subscribe({
      next: () => {},
      error: (error: Error) => {
        expect(error.message).toBe('Failed to upload');
      },
    });
  });
});
