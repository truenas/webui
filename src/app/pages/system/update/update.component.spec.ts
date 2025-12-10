import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiErrorName } from 'app/enums/api.enum';
import { UpdateCode } from 'app/enums/system-update.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  UpdateConfig,
  UpdateProfileChoice,
  UpdateProfileChoices,
  UpdateStatus,
} from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { jobsInitialState } from 'app/modules/jobs/store/job.reducer';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SaveConfigDialog,
} from 'app/pages/system/advanced/manage-configuration-menu/save-config-dialog/save-config-dialog.component';
import {
  UpdateProfileCard,
} from 'app/pages/system/update/components/update-profile-card/update-profile-card.component';
import { UpdateComponent } from 'app/pages/system/update/update.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError } from 'app/services/errors/error.classes';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('UpdateComponent', () => {
  let spectator: Spectator<UpdateComponent>;
  let loader: HarnessLoader;

  const profileChoices = {
    CONSERVATIVE: {
      name: 'Conservative',
      available: true,
    } as UpdateProfileChoice,
    DEVELOPER: {
      name: 'Developer',
      available: true,
    } as UpdateProfileChoice,
  } as UpdateProfileChoices;

  const updateConfig = {
    profile: 'DEVELOPER',
  } as UpdateConfig;

  const createComponent = createComponentFactory({
    component: UpdateComponent,
    imports: [
      MockComponent(UpdateProfileCard),
    ],
    providers: [
      mockApi([
        mockJob('update.run', fakeSuccessfulJob()),
        mockJob('failover.upgrade', fakeSuccessfulJob()),
        mockCall('webui.main.dashboard.sys_info', {
          version: '22.12.3',
        } as SystemInfo),
        mockCall('update.profile_choices', profileChoices),
        mockCall('update.status', {
          code: UpdateCode.Normal,
          error: null,
          status: {
            current_version: {
              matches_profile: true,
            },
            new_version: null,
          },
        } as UpdateStatus),
        mockCall('update.config', updateConfig),
      ]),
      mockAuth(),
      provideMockStore({
        initialState: {
          jobs: jobsInitialState,
        },
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
          {
            selector: selectUpdateJob,
            value: [],
          },
        ],
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          close: jest.fn(),
          afterClosed: () => of(true),
        } as unknown as MatDialogRef<unknown>)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(SystemGeneralService, {
        updateRunningNoticeSent: new EventEmitter<void>(),
      }),
      mockProvider(ErrorHandlerService, {
        showErrorModal: jest.fn(() => of(true)),
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(HttpClient, {
        head: jest.fn().mockReturnValue(of({ status: 200 } as HttpResponse<void>)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('page elements', () => {
    it('shows current version', () => {
      const versionElement = spectator.query(byText('Current version:'));

      expect(versionElement.parentElement).toHaveText('22.12.3');
    });

    it('adds a note if profile of the currently installed version differs from profile in config', () => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('update.status', {
        code: UpdateCode.Normal,
        error: null,
        status: {
          current_version: {
            matches_profile: false,
            profile: 'CONSERVATIVE',
          },
          new_version: null,
        },
      } as UpdateStatus);

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const profileMismatchNote = spectator.query('.profile-mismatch');
      expect(profileMismatchNote).toBeTruthy();
      expect(profileMismatchNote).toHaveText('(from Conservative profile)');
    });

    it('renders ix-update-profile-card', () => {
      const updateProfileCard = spectator.query(UpdateProfileCard);

      expect(updateProfileCard).toBeTruthy();
      expect(updateProfileCard.profileChoices).toBe(profileChoices);
      expect(updateProfileCard.currentProfileId).toBe('DEVELOPER');
    });

    it('queries update status, config and profile choices on page load', () => {
      const api = spectator.inject(ApiService);

      expect(api.call).toHaveBeenCalledWith('update.profile_choices');
      expect(api.call).toHaveBeenCalledWith('update.status');
      expect(api.call).toHaveBeenCalledWith('update.config');
    });

    it('reloads update info when profile is switched', () => {
      const api = spectator.inject(ApiService);
      jest.clearAllMocks();

      const updateProfileCard = spectator.query(UpdateProfileCard);
      updateProfileCard.profileSwitched.emit();

      expect(api.call).toHaveBeenCalledWith('update.profile_choices');
      expect(api.call).toHaveBeenCalledWith('update.status');
      expect(api.call).toHaveBeenCalledWith('update.config');
    });
  });

  describe('when there are no updates', () => {
    it('shows line that system is up to date', async () => {
      const upToDateMessage = spectator.query(byText('System is up to date!'));
      expect(upToDateMessage).toBeTruthy();

      const checkIcon = await loader.getHarness(IxIconHarness.with({ name: 'check_circle' }));
      expect(checkIcon).toBeTruthy();
    });
  });

  describe('when there are updates', () => {
    beforeEach(() => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('update.status', {
        code: UpdateCode.Normal,
        error: null,
        status: {
          current_version: {
            matches_profile: true,
            profile: 'DEVELOPER',
          },
          new_version: {
            version: '22.12.4',
            manifest: {
              changelog: 'Important changes',
            },
            release_notes_url: 'http://truenas.com/release-notes/22.12.4',
          },
        },
      } as UpdateStatus);

      spectator.component.ngOnInit();
      spectator.detectChanges();
    });

    it('shows new version', () => {
      const newVersionElement = spectator.query(byText('Update version:'));
      expect(newVersionElement).toBeTruthy();
      expect(newVersionElement.parentElement).toHaveText('22.12.4');
    });

    it('shows changelog', () => {
      const changelogElement = spectator.query('.changelog');
      expect(changelogElement).toBeTruthy();
      expect(changelogElement).toHaveText('Important changes');
    });

    it('shows release notes url', () => {
      const releaseNotesLink = spectator.query('.release-notes-link');
      expect(releaseNotesLink).toBeTruthy();
      expect(releaseNotesLink.getAttribute('href')).toBe('http://truenas.com/release-notes/22.12.4');
      expect(releaseNotesLink).toHaveText('View Release Notes');
    });

    it('offers to save config when Install Update is pressed', async () => {
      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Update' }));
      await installButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialog, {
        data: expect.objectContaining({
          title: 'Save configuration settings from this machine before updating?',
        }),
      });
    });

    it('asks for confirmation before installing updates', async () => {
      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Update' }));
      await installButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Install Update?',
      }));
    });

    it('runs the update', async () => {
      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Update' }));
      await installButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('update.run', [{ reboot: true }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalledWith(
        expect.any(Object),
        { title: 'Update' },
      );
    });

    it('uses failover.upgrade for HA systems', async () => {
      const mockStore$ = spectator.inject(MockStore);
      mockStore$.overrideSelector(selectIsHaLicensed, true);
      mockStore$.refreshState();

      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Update' }));
      await installButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('failover.upgrade');
    });
  });

  describe('when there is an error getting an update', () => {
    it('shows the error', () => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('update.status', {
        code: UpdateCode.Error,
        error: {
          errname: 'GENERIC_ERROR',
          reason: 'Failed to check for updates',
        },
        status: null,
      } as UpdateStatus);

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const errorElement = spectator.query(byText('Failed to check for updates'));
      expect(errorElement).toBeTruthy();
    });
  });

  describe('manual update', () => {
    it('shows Other Options with Manual Update', () => {
      const h3 = spectator.query('.other-options h3');
      expect(h3).toHaveText('Other Options');

      const h4 = spectator.query('.other-options h4');
      expect(h4).toHaveText('Manual Update');

      const paragraph = spectator.query('.manual-update');
      expect(paragraph?.textContent).toContain('See the manual image installation guide');

      const link = spectator.query('.manual-update a');
      expect(link.getAttribute('href')).toContain('https://www.truenas.com/docs/scale/22.12/scaletutorials/systemsettings/updatescale/');
    });

    it('offers to save configuration and redirects user when Install manual update is pressed', async () => {
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate').mockImplementation();

      const installManualButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install', ancestor: '.manual-update' }));
      await installManualButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialog, {
        data: expect.objectContaining({
          saveButton: 'Save Configuration',
        }),
      });

      expect(router.navigate).toHaveBeenCalledWith(['/system/update/manualupdate']);
    });
  });

  describe('dynamic documentation URL', () => {
    let localSpectator: Spectator<UpdateComponent>;
    let httpClientSpy: jest.SpyInstance;

    it('uses versioned documentation URL when version is available and the URL exists', async () => {
      const httpSuccess$ = of({ status: 200 } as HttpResponse<void>);

      localSpectator = createComponent({ detectChanges: false });
      httpClientSpy = jest.spyOn(localSpectator.inject(HttpClient), 'head').mockReturnValue(httpSuccess$);

      localSpectator.component.ngOnInit();
      await localSpectator.fixture.whenStable();
      localSpectator.detectChanges();

      const link = localSpectator.query('a[ixTest="download-truenas"]');
      expect(link.getAttribute('href')).toBe(
        'https://www.truenas.com/docs/scale/22.12/scaletutorials/systemsettings/updatescale/',
      );

      httpClientSpy.mockRestore();
    });

    it('falls back to generic URL when versioned URL does not exist (404)', async () => {
      const httpFailure$ = throwError(() => ({ status: 404 } as HttpErrorResponse));

      localSpectator = createComponent({ detectChanges: false });
      httpClientSpy = jest.spyOn(localSpectator.inject(HttpClient), 'head').mockReturnValue(httpFailure$);

      localSpectator.component.ngOnInit();
      await localSpectator.fixture.whenStable();
      localSpectator.detectChanges();

      // should fallback to generic URL
      const link = localSpectator.query('a[ixTest="download-truenas"]');
      expect(link.getAttribute('href')).toBe(
        'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/updatescale/',
      );

      httpClientSpy.mockRestore();
    });
  });

  describe('when network activity is disabled', () => {
    it('shows network activity disabled message', () => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('update.status', {
        code: UpdateCode.NetworkActivityDisabled,
        error: null,
        status: null,
      } as UpdateStatus);

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const networkDisabledMessage = spectator.query(byText('Network activity has been administratively disabled for update operation. Please use Manual Update.'));
      expect(networkDisabledMessage).toBeTruthy();
    });

    it('does not show error field when network activity is disabled', () => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('update.status', {
        code: UpdateCode.NetworkActivityDisabled,
        error: {
          errname: 'GENERIC_ERROR',
          reason: 'Some error message that should not be shown',
        },
        status: null,
      } as UpdateStatus);

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const errorElement = spectator.query(byText('Some error message that should not be shown'));
      expect(errorElement).toBeFalsy();
    });
  });

  describe('API error handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('does not show error dialog for ENONET errors', () => {
      const api = spectator.inject(ApiService);
      const errorHandler = spectator.inject(ErrorHandlerService);

      const enonetError = new ApiCallError({
        code: -32001,
        message: 'Network error',
        data: {
          errname: ApiErrorName.NoNetwork,
          error: 60,
          extra: null,
          reason: 'Network is disabled',
          trace: null,
        },
      });

      // Override the API call to throw an ENONET error for profile_choices
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return throwError(() => enonetError);
        }
        if (method === 'update.status') {
          return of({
            code: UpdateCode.Normal,
            status: null,
            error: null,
          } as UpdateStatus);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      expect(errorHandler.showErrorModal).not.toHaveBeenCalled();
    });

    it('shows error dialog for other API errors', () => {
      const api = spectator.inject(ApiService);
      const errorHandler = spectator.inject(ErrorHandlerService);

      const validationError = new ApiCallError({
        code: -32001,
        message: 'Validation error',
        data: {
          errname: ApiErrorName.Validation,
          error: 22,
          extra: null,
          reason: 'Invalid parameter',
          trace: null,
        },
      });

      // Override the API call to throw an error for profile_choices
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return throwError(() => validationError);
        }
        if (method === 'update.status') {
          return of({
            code: UpdateCode.Normal,
            status: null,
            error: null,
          } as UpdateStatus);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(validationError);
    });

    it('handles multiple API errors correctly', () => {
      const api = spectator.inject(ApiService);
      const errorHandler = spectator.inject(ErrorHandlerService);

      const enonetError = new ApiCallError({
        code: -32001,
        message: 'Network error',
        data: {
          errname: ApiErrorName.NoNetwork,
          error: 60,
          extra: null,
          reason: 'Network is disabled',
          trace: null,
        },
      });

      const validationError = new ApiCallError({
        code: -32001,
        message: 'Validation error',
        data: {
          errname: ApiErrorName.Validation,
          error: 22,
          extra: null,
          reason: 'Invalid parameter',
          trace: null,
        },
      });

      // Override the API call to throw different errors
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return throwError(() => enonetError);
        }
        if (method === 'update.status') {
          return throwError(() => validationError);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // ENONET error should not trigger error dialog
      // Validation error should trigger error dialog
      expect(errorHandler.showErrorModal).toHaveBeenCalledTimes(1);
      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(validationError);
    });

    it('shows network error dialog for ECONNRESET errors', () => {
      const api = spectator.inject(ApiService);
      const errorHandler = spectator.inject(ErrorHandlerService);

      const connectionResetError = new ApiCallError({
        code: -32001,
        message: 'Connection reset error',
        data: {
          errname: ApiErrorName.ConnectionReset,
          error: 104,
          extra: null,
          reason: 'Connection reset by peer',
          trace: null,
        },
      });

      // Override the API call to throw a ECONNRESET error for update.status
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return of(profileChoices);
        }
        if (method === 'update.status') {
          return throwError(() => connectionResetError);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // The error handler should be called, which will internally show the network error dialog
      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(connectionResetError);
    });

    it('shows network error dialog for ETIMEDOUT errors', () => {
      const api = spectator.inject(ApiService);
      const errorHandler = spectator.inject(ErrorHandlerService);

      const timedOutError = new ApiCallError({
        code: -32001,
        message: 'Connection timed out',
        data: {
          errname: ApiErrorName.TimedOut,
          error: 110,
          extra: null,
          reason: 'Connection timed out',
          trace: null,
        },
      });

      // Override the API call to throw an ETIMEDOUT error for update.status
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return of(profileChoices);
        }
        if (method === 'update.status') {
          return throwError(() => timedOutError);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // The error handler should be called, which will internally show the network error dialog
      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(timedOutError);
    });

    it('shows custom error message for ECONNRESET in update.status response', () => {
      const api = spectator.inject(ApiService);

      // Override the API call to return ECONNRESET error in update.status response
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return of(profileChoices);
        }
        if (method === 'update.status') {
          return of({
            code: UpdateCode.Error,
            error: {
              errname: ApiErrorName.ConnectionReset,
              reason: 'Connection reset by peer',
            },
            status: null,
          } as UpdateStatus);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // The custom error message should be displayed
      const errorElement = spectator.query(byText('Network connection was closed or timed out. Try again later.'));
      expect(errorElement).toBeTruthy();
    });

    it('shows custom error message for ETIMEDOUT in update.status response', () => {
      const api = spectator.inject(ApiService);

      // Override the API call to return ETIMEDOUT error in update.status response
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return of(profileChoices);
        }
        if (method === 'update.status') {
          return of({
            code: UpdateCode.Error,
            error: {
              errname: ApiErrorName.TimedOut,
              reason: 'Connection timed out',
            },
            status: null,
          } as UpdateStatus);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // The custom error message should be displayed
      const errorElement = spectator.query(byText('Network connection was closed or timed out. Try again later.'));
      expect(errorElement).toBeTruthy();
    });

    it('shows custom error message for ENETUNREACH in update.status response', () => {
      const api = spectator.inject(ApiService);

      // Override the API call to return ENETUNREACH error in update.status response
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'update.profile_choices') {
          return of(profileChoices);
        }
        if (method === 'update.status') {
          return of({
            code: UpdateCode.Error,
            error: {
              errname: ApiErrorName.NetworkUnreachable,
              reason: 'Network is unreachable',
            },
            status: null,
          } as UpdateStatus);
        }
        if (method === 'update.config') {
          return of(updateConfig);
        }
        if (method === 'webui.main.dashboard.sys_info') {
          return of({ version: '22.12.3' } as SystemInfo);
        }
        return throwError(() => new Error(`Unmocked call: ${method}`));
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // The custom error message should be displayed
      const errorElement = spectator.query(byText('Network resource is not reachable, verify your network settings and health.'));
      expect(errorElement).toBeTruthy();
    });
  });
});
