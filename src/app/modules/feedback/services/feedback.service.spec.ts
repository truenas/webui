import { HttpClient, HttpResponse } from '@angular/common/http';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { lastValueFrom, of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { SentryService } from 'app/services/sentry.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectSystemHostId } from 'app/store/system-info/system-info.selectors';

describe('FeedbackService', () => {
  let spectator: SpectatorService<FeedbackService>;
  let fileUploadService: IxFileUploadService;
  const createService = createServiceFactory({
    service: FeedbackService,
    providers: [
      mockWebSocket([

      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemHostId,
            value: 'testHostId',
          },
        ],
      }),
      mockProvider(SystemGeneralService),
      mockProvider(HttpClient),
      mockProvider(SentryService, {
        sessionId$: of('testSessionId'),
      }),
      mockProvider(IxFileUploadService, {
        upload2: jest.fn(() => of(new HttpResponse({ status: 200 }))),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    fileUploadService = spectator.inject(IxFileUploadService);
  });

  describe('getHostId', () => {
    it('return system host id from the store', async () => {
      expect(await lastValueFrom(spectator.service.getHostId())).toBe('testHostId');
    });
  });

  describe('addDebugInfoToMessage', () => {
    it('appends host ID and sentry session id to the error message', async () => {
      const message = 'test message';
      const messageWithDebug = await lastValueFrom(spectator.service.addDebugInfoToMessage(message));

      expect(messageWithDebug).toBe('test message\n'
        + '\n'
        + 'Host ID: testHostId\n'
        + '\n'
        + 'Session ID: testSessionId');
    });
  });

  describe('addAttachmentsToTicket', () => {
    const fakeScreenshot = fakeFile('screenshot.png');
    const file1 = fakeFile('file1.png');
    const file2 = fakeFile('file2.png');

    beforeEach(() => {
      jest.spyOn(spectator.service, 'takeScreenshot').mockReturnValue(of(fakeScreenshot));
    });

    it('completes when not attachments are required and no screenshots were added', async () => {
      const settings = {
        attachments: [] as File[],
        takeScreenshot: false,
        ticketId: 1,
        token: 'test-token',
      };

      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      expect(await lastValueFrom(spectator.service.addTicketAttachments(settings))).toBeUndefined();
    });

    it('takes a screenshot when it has been requested and attaches it to ticket', async () => {
      const settings = {
        attachments: [] as File[],
        takeScreenshot: true,
        ticketId: 1,
        token: 'test-token',
      };

      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      expect(await lastValueFrom(spectator.service.addTicketAttachments(settings))).toBeUndefined();

      expect(spectator.service.takeScreenshot).toHaveBeenCalled();
      expect(fileUploadService.upload2).toHaveBeenCalledWith(fakeScreenshot, 'support.attach_ticket', [{
        token: 'test-token',
        ticket: 1,
        filename: 'screenshot.png',
      }]);
    });

    it('takes a screenshot and uploads attachments', async () => {
      const settings = {
        attachments: [file1, file2],
        takeScreenshot: true,
        ticketId: 1,
        token: 'test-token',
      };

      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      expect(await lastValueFrom(spectator.service.addTicketAttachments(settings))).toBeUndefined();

      expect(spectator.service.takeScreenshot).toHaveBeenCalled();

      expect(fileUploadService.upload2).toHaveBeenCalledTimes(3);
      expect(fileUploadService.upload2).toHaveBeenCalledWith(fakeScreenshot, 'support.attach_ticket', [{
        token: 'test-token',
        ticket: 1,
        filename: 'screenshot.png',
      }]);
      expect(fileUploadService.upload2).toHaveBeenCalledWith(file1, 'support.attach_ticket', [{
        token: 'test-token',
        ticket: 1,
        filename: 'file1.png',
      }]);
      expect(fileUploadService.upload2).toHaveBeenCalledWith(file2, 'support.attach_ticket', [{
        token: 'test-token',
        ticket: 1,
        filename: 'file2.png',
      }]);
    });

    // TODO: Add tests testing that uploading an image or taking a screenshot continues when one of the requests fails.
  });
});
