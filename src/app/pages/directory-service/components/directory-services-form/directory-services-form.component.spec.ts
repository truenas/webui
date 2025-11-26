import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ActiveDirectoryConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/active-directory-config.component';
import { CredentialConfigComponent } from 'app/pages/directory-service/components/directory-services-form/credential-config/credential-config.component';
import { IpaConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ipa-config/ipa-config.component';
import { LdapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ldap-config/ldap-config.component';
import { DirectoryServicesFormComponent } from './directory-services-form.component';

describe('DirectoryServicesConfigFormComponent', () => {
  let spectator: Spectator<DirectoryServicesFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const mockSlideInRef = {
    getData: () => null as DirectoryServicesConfig,
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(() => of(false)),
    swap: jest.fn(),
  };

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
      mockProvider(SlideInRef, mockSlideInRef),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockApi([
        mockJob('directoryservices.update'),
      ]),
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

  describe('clear config', () => {
    it('should show confirmation dialog and call API when Clear Config is clicked', async () => {
      const clearConfigButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear Config' }));
      await clearConfigButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: 'Clear Directory Services Configuration',
        message: 'Directory service will be disabled and all settings will be lost. Are you sure you want to continue?',
        buttonText: 'Clear',
      });

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(mockSlideInRef.close).toHaveBeenCalledWith({ response: true });
    });

    it('should not call API when confirmation is cancelled', async () => {
      const dialogService = spectator.inject(DialogService);
      (dialogService.confirm as jest.Mock).mockReturnValue(of(false));

      const clearConfigButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear Config' }));
      await clearConfigButton.click();

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(dialogService.jobDialog).not.toHaveBeenCalled();
    });
  });
});
