import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { JobProgressDialogRef } from 'app/classes/job-progress-dialog-ref.class';
import { JobState } from 'app/enums/job-state.enum';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ActiveDirectoryConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/active-directory-config.component';
import { CredentialConfigComponent } from 'app/pages/directory-service/components/directory-services-form/credential-config/credential-config.component';
import { IpaConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ipa-config/ipa-config.component';
import { LdapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ldap-config/ldap-config.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { DirectoryServicesFormComponent } from './directory-services-form.component';

describe('DirectoryServicesConfigFormComponent', () => {
  let spectator: Spectator<DirectoryServicesFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: DirectoryServicesFormComponent,
    declarations: [
      MockComponents(
        CredentialConfigComponent,
        LdapConfigComponent,
        ActiveDirectoryConfigComponent,
        IpaConfigComponent,
      ),
    ],
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef, {
        getData: () => null as DirectoryServicesConfig,
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(() => of(false)),
        swap: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of({ description: 'Directory Service cache has been rebuilt.' })),
        })),
        error: jest.fn(),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
      }),
      mockProvider(SystemGeneralService, {
        refreshDirServicesCache: jest.fn(() => of({
          id: 1,
          method: 'directoryservices.cache_refresh',
          arguments: [],
          description: 'Refreshing directory services cache',
          state: JobState.Success,
          abortable: false,
          transient: false,
        } as Job)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should require configuration type selection', async () => {
      await form.fillForm({
        'Enable Service': true,
        'Timeout (seconds)': 60,
      });

      expect(await form.getControl('Configuration Type')).toBeTruthy();
      expect((spectator.component as unknown as { form: { invalid: boolean } }).form.invalid).toBe(true);
    });

    it('should show Active Directory fields when AD configuration is selected', async () => {
      await form.fillForm({
        'Configuration Type': 'Active Directory',
      });

      expect(spectator.query(ActiveDirectoryConfigComponent)).toBeTruthy();
    });

    it('should show LDAP fields when LDAP configuration is selected', async () => {
      await form.fillForm({
        'Configuration Type': 'LDAP',
      });

      expect(spectator.query(LdapConfigComponent)).toBeTruthy();
    });

    it('should show IPA fields when IPA configuration is selected', async () => {
      await form.fillForm({
        'Configuration Type': 'IPA',
      });

      expect(spectator.query(IpaConfigComponent)).toBeTruthy();
    });
  });

  describe('onRebuildCachePressed', () => {
    it('should call systemGeneralService.refreshDirServicesCache and show success message', () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const dialogService = spectator.inject(DialogService);
      const snackbarService = spectator.inject(SnackbarService);

      const mockJob = {
        id: 1,
        method: 'directoryservices.cache_refresh',
        arguments: [],
        description: 'Refreshing directory services cache',
        state: JobState.Success,
        abortable: false,
        transient: false,
      } as Job;

      jest.spyOn(systemGeneralService, 'refreshDirServicesCache').mockReturnValue(of(mockJob));
      const mockDialogRef = {
        afterClosed: jest.fn(() => of({ description: 'Cache rebuilt successfully' })),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(dialogService, 'jobDialog').mockReturnValue(mockDialogRef);

      const rebuildButton = spectator.query('[ixTest="rebuild-cache"]') as HTMLButtonElement;
      rebuildButton.click();

      expect(systemGeneralService.refreshDirServicesCache).toHaveBeenCalled();
      expect(dialogService.jobDialog).toHaveBeenCalled();
      expect(snackbarService.success).toHaveBeenCalledWith('Cache rebuilt successfully');
    });

    it('should show error dialog when cache rebuild fails', () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const dialogService = spectator.inject(DialogService);

      // Mock console.error to prevent test failure
      jest.spyOn(console, 'error').mockImplementation();

      const mockJob = {
        id: 1,
        method: 'directoryservices.cache_refresh',
        arguments: [],
        description: 'Refreshing directory services cache',
        state: JobState.Success,
        abortable: false,
        transient: false,
      } as Job;

      jest.spyOn(systemGeneralService, 'refreshDirServicesCache').mockReturnValue(of(mockJob));
      const mockDialogRef = {
        afterClosed: jest.fn(() => throwError(() => new Error('Cache rebuild failed'))),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(dialogService, 'jobDialog').mockReturnValue(mockDialogRef);
      jest.spyOn(dialogService, 'error');

      const rebuildButton = spectator.query('[ixTest="rebuild-cache"]') as HTMLButtonElement;
      rebuildButton.click();

      expect(dialogService.error).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Failed to rebuild directory service cache.',
      });
      expect(console.error).toHaveBeenCalledWith('Failed to rebuild directory service cache:', expect.any(Error));
    });

    it('should show default success message when no description is provided', () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const dialogService = spectator.inject(DialogService);
      const snackbarService = spectator.inject(SnackbarService);

      const mockJob = {
        id: 1,
        method: 'directoryservices.cache_refresh',
        arguments: [],
        description: 'Refreshing directory services cache',
        state: JobState.Success,
        abortable: false,
        transient: false,
      } as Job;

      jest.spyOn(systemGeneralService, 'refreshDirServicesCache').mockReturnValue(of(mockJob));
      const mockDialogRef = {
        afterClosed: jest.fn(() => of({ description: null })),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(dialogService, 'jobDialog').mockReturnValue(mockDialogRef);

      const rebuildButton = spectator.query('[ixTest="rebuild-cache"]') as HTMLButtonElement;
      rebuildButton.click();

      expect(snackbarService.success).toHaveBeenCalledWith('Directory Service cache has been rebuilt.');
    });
  });
});
