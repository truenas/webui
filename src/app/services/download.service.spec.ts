import { HttpClient } from '@angular/common/http';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { DownloadService } from 'app/services/download.service';

describe('DownloadService', () => {
  let spectator: SpectatorService<DownloadService>;
  let anchorMock: HTMLAnchorElement;
  const createService = createServiceFactory({
    service: DownloadService,
    providers: [
      mockProvider(HttpClient),
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
});
