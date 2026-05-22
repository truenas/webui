import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Subject, of, tap } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  SmartAlertAction,
  SmartAlertActionType,
  SmartAlertCategory,
} from 'app/interfaces/smart-alert.interface';
import { SmartAlertService } from 'app/modules/alerts/services/smart-alert.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('SmartAlertService', () => {
  let spectator: SpectatorService<SmartAlertService>;
  let router: Router;
  let dialogService: DialogService;

  const cloudBackupAlert = {
    id: '42',
    klass: AlertClassName.CloudBackupTaskFailed,
    source: '',
    level: AlertLevel.Critical,
    formatted: 'Cloud Backup Task "Nightly Backup" failed.',
    text: 'Cloud Backup Task "Nightly Backup" failed.',
    args: [{ id: 7, name: 'Nightly Backup' }],
    dismissed: false,
  } as unknown as Alert;

  const snapshotAlert = {
    id: '43',
    klass: AlertClassName.SnapshotFailed,
    source: '',
    level: AlertLevel.Critical,
    formatted: 'Periodic snapshot task "tank/data" failed.',
    text: 'Periodic snapshot task "tank/data" failed.',
    args: [],
    dismissed: false,
  } as unknown as Alert;

  const createService = createServiceFactory({
    service: SmartAlertService,
    providers: [
      mockApi([
        mockJob('cloud_backup.sync', fakeSuccessfulJob()),
      ]),
      mockProvider(Router, {
        url: '/dashboard',
        events: new Subject(),
        navigate: jest.fn(() => Promise.resolve(true)),
        navigateByUrl: jest.fn(() => Promise.resolve(true)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(UiSearchDirectivesService, {
        get: jest.fn(() => null),
        setPendingUiHighlightElement: jest.fn(),
        directiveAdded$: new Subject(),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
        error: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => tap(() => {})),
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string, params?: Record<string, unknown>) => {
          if (params) {
            return Object.entries(params).reduce(
              (str, [name, value]) => str.replace(`{${name}}`, String(value)),
              key,
            );
          }
          return key;
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    router = spectator.inject(Router);
    dialogService = spectator.inject(DialogService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function findRunTaskAction(alert: Alert): SmartAlertAction | undefined {
    const enhanced = spectator.service.enhanceAlert(alert);
    return enhanced.actions?.find(
      (action) => action.type === SmartAlertActionType.RunTask,
    );
  }

  describe('enhanceAlert', () => {
    it('returns enhancement with correct route for SnapshotFailed', () => {
      const enhanced = spectator.service.enhanceAlert(snapshotAlert);

      expect(enhanced.category).toBe(SmartAlertCategory.Tasks);
      expect(enhanced.relatedMenuPath).toEqual(['data-protection', 'snapshot']);
      expect(enhanced.actions?.[0].label).toBe('View Snapshot Tasks');
      expect(enhanced.actions?.[0].route).toEqual(['/data-protection', 'snapshot']);
    });

    it('returns a fallback category when no enhancement is found', () => {
      const orphanAlert = {
        id: '99',
        klass: 'NonExistentClass',
        source: '',
        text: '',
        formatted: '',
        args: null,
      } as unknown as Alert;

      const enhanced = spectator.service.enhanceAlert(orphanAlert);

      expect(enhanced.category).toBe(SmartAlertCategory.System);
    });

    it('binds a handler that calls router.navigate for navigation actions', () => {
      const enhanced = spectator.service.enhanceAlert(snapshotAlert);
      const navigateAction = enhanced.actions?.find(
        (action) => action.type === SmartAlertActionType.Navigate,
      );

      navigateAction?.handler?.();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/data-protection', 'snapshot'],
        { queryParams: undefined },
      );
    });
  });

  describe('handleRunTask', () => {
    it('navigates to the related route before showing the confirm dialog', fakeAsync(() => {
      const dialogConfirmSpy = jest.spyOn(dialogService, 'confirm');
      const navigateByUrlSpy = jest.spyOn(router, 'navigateByUrl');

      findRunTaskAction(cloudBackupAlert)?.handler?.();
      flushMicrotasks();

      expect(navigateByUrlSpy).toHaveBeenCalledWith('/data-protection/cloud-backup');
      const navigationCallOrder = navigateByUrlSpy.mock.invocationCallOrder[0];
      const confirmCallOrder = dialogConfirmSpy.mock.invocationCallOrder[0];
      expect(navigationCallOrder).toBeLessThan(confirmCallOrder);
    }));

    it('skips navigation when the user is already on the related task page', () => {
      jest.replaceProperty(router, 'url', '/data-protection/cloud-backup');

      findRunTaskAction(cloudBackupAlert)?.handler?.();

      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/data-protection/cloud-backup');
      expect(dialogService.confirm).toHaveBeenCalled();
    });

    it('runs the api job when the user confirms the dialog', () => {
      jest.replaceProperty(router, 'url', '/data-protection/cloud-backup');
      const apiService = spectator.inject(ApiService);
      const jobSpy = jest.spyOn(apiService, 'job');

      findRunTaskAction(cloudBackupAlert)?.handler?.();

      expect(jobSpy).toHaveBeenCalledWith('cloud_backup.sync', [7]);
    });

    it('does not run the api job if the user cancels the dialog', () => {
      jest.replaceProperty(router, 'url', '/data-protection/cloud-backup');
      const dialogConfirm = dialogService.confirm as unknown as jest.Mock;
      dialogConfirm.mockReturnValueOnce(of(false));
      const apiService = spectator.inject(ApiService);
      const jobSpy = jest.spyOn(apiService, 'job');

      findRunTaskAction(cloudBackupAlert)?.handler?.();

      expect(jobSpy).not.toHaveBeenCalled();
    });
  });

  describe('groupAlertsByCategory', () => {
    it('groups enhanced alerts by their category', () => {
      const cloud = spectator.service.enhanceAlert(cloudBackupAlert);
      const snapshot = spectator.service.enhanceAlert(snapshotAlert);

      const grouped = spectator.service.groupAlertsByCategory([cloud, snapshot]);

      expect(grouped.get(SmartAlertCategory.Tasks)?.length).toBe(2);
    });
  });

  describe('getAlertCountsByMenuPath', () => {
    it('counts alerts by their related menu path and parent paths', () => {
      const cloud = spectator.service.enhanceAlert(cloudBackupAlert);

      const counts = spectator.service.getAlertCountsByMenuPath([cloud]);

      expect(counts.get('data-protection')?.critical).toBe(1);
      expect(counts.get('data-protection.cloud-backup')?.critical).toBe(1);
    });
  });
});
