import { HttpClient } from '@angular/common/http';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';

describe('DownloadService', () => {
  let spectator: SpectatorService<DownloadService>;
  let anchorMock: HTMLAnchorElement;
  const createService = createServiceFactory({
    service: DownloadService,
    providers: [
      mockProvider(HttpClient),
      mockApi([
        mockCall('core.download', [123, 'http://localhost/download.file']),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    anchorMock = {
      download: '',
      href: '',
      click: () => {},
      remove: () => {},
    } as HTMLAnchorElement;
    jest.spyOn(anchorMock, 'click').mockImplementation();
    jest.spyOn(anchorMock, 'remove').mockImplementation();

    jest.spyOn(document, 'createElement').mockReturnValue(anchorMock);
    jest.spyOn(document.body, 'appendChild').mockImplementation();
  });

  describe('downloadBlob', () => {
    it('initiates download by creating an anchor element and clicking on it', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.txt';

      spectator.service.downloadBlob(blob, filename);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalledWith(anchorMock);
      expect(anchorMock.download).toBe(filename);
      expect(anchorMock.click).toHaveBeenCalled();
      expect(anchorMock.remove).toHaveBeenCalled();
    });
  });

  describe('downloadText', () => {
    it('download text content with a filename', () => {
      jest.spyOn(spectator.service, 'downloadBlob');

      const content = 'Lorem';
      const filename = 'test.txt';

      spectator.service.downloadText(content, filename);

      expect(spectator.service.downloadBlob)
        .toHaveBeenCalledWith(new Blob([content], { type: 'text/plain' }), filename);
    });
  });

  describe('coreDownload', () => {
    it('calls core.download, waits for job to complete and then downloads the file', () => {
      jest.spyOn(spectator.inject(Store), 'select').mockReturnValue(of({
        id: 123,
        time_finished: {
          $date: (new Date()).getTime(),
        },
        state: JobState.Finished,
      }));
      jest.spyOn(spectator.service, 'downloadUrl').mockReturnValue(of(new Blob()));

      spectator.service.coreDownload({
        fileName: 'test.csr',
        method: 'filesystem.get',
        arguments: ['argument'],
        mimeType: 'application/x-x509-user-cert',
      }).subscribe();

      expect(spectator.inject(ApiService).call)
        .toHaveBeenCalledWith('core.download', ['filesystem.get', ['argument'], 'test.csr']);
      expect(spectator.inject(DownloadService).downloadUrl)
        .toHaveBeenCalledWith('http://localhost/download.file', 'test.csr', 'application/x-x509-user-cert');
    });
  });
});
