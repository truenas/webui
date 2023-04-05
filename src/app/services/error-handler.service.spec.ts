import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const error = new Error('Dummy Error');
const wsError: WebsocketError = {
  error: 1,
  extra: [['SOMETHING'], ['SOMETHING ELSE']],
  reason: 'SOME REASON',
  trace: {
    class: 'CLASS',
    formatted: 'FORMATTED',
    frames: null,
  },
  type: null,
};
const failedJob = {
  method: 'cloudsync.sync_onetime',
  description: null,
  error: 'DUMMY_ERROR',
  exception: 'EXCEPTION',
  exc_info: {
    repr: 'ValidationErrors()',
    type: 'VALIDATION',
    extra: [
      [
        'cloud_sync_sync_onetime.path',
        'DUMMY_ERROR',
        22,
      ],
    ],
  },
  state: 'FAILED',
} as Job;

describe('ErrorHandlerService', () => {
  let spectator: SpectatorService<ErrorHandlerService>;
  const createService = createServiceFactory({
    service: ErrorHandlerService,
    providers: [
      mockProvider(Injector, {
        get: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    const dialogService = spectator.inject(DialogService);
    Object.defineProperty(dialogService, 'error', {
      value: jest.fn(() => of(true)),
    });

    Object.defineProperty(spectator.service, 'dialog', {
      get: () => dialogService,
    });

    const translateService = spectator.inject(TranslateService);
    Object.defineProperty(spectator.service, 'translate', {
      value: translateService,
    });

    Object.defineProperty(spectator.service, 'logToSentry', {
      value: jest.fn(),
    });
  });

  describe('handleError', () => {
    it('logs normal error to console and sentry', () => {
      jest.spyOn(spectator.service, 'parseError');
      jest.spyOn(console, 'error');
      spectator.service.handleError(error);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(spectator.service.parseError).toHaveBeenCalledWith(error);
      expect(spectator.service.logToSentry).toHaveBeenCalledWith(error);
    });

    it('logs websocket error via dialog', () => {
      spectator.inject(MatDialog);
      spectator.service.handleError(wsError);

      expect(spectator.service.dialog.error).toHaveBeenCalledWith({
        backtrace: 'FORMATTED',
        message: 'SOME REASON',
        title: 'CLASS',
      });
      expect(spectator.service.logToSentry).toHaveBeenCalledWith({
        backtrace: 'FORMATTED',
        message: 'SOME REASON',
        title: 'CLASS',
      });
    });

    it('logs job error via dialog', () => {
      spectator.inject(MatDialog);
      spectator.service.handleError(failedJob);

      expect(spectator.service.dialog.error).toHaveBeenCalledWith([{
        backtrace: 'EXCEPTION',
        message: 'DUMMY_ERROR',
        title: 'Error: path',
      }]);
      expect(spectator.service.logToSentry).toHaveBeenCalledWith([{
        backtrace: 'EXCEPTION',
        message: 'DUMMY_ERROR',
        title: 'Error: path',
      }]);
    });
  });
});
