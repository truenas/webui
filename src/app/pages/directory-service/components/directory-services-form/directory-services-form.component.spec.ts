import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxComponent,
  TnCheckboxHarness,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
  TnInputHarness,
  TnSelectComponent,
  TnSelectHarness,
} from '@truenas/ui-components';
import { MockComponents, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ActiveDirectoryConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/active-directory-config.component';
import { CredentialConfigComponent } from 'app/pages/directory-service/components/directory-services-form/credential-config/credential-config.component';
import { IpaConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ipa-config/ipa-config.component';
import { LdapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/ldap-config/ldap-config.component';
import { DirectoryServicesFormComponent } from './directory-services-form.component';

// MockComponents(...) on the child config forms deep-mocks the tn-* form controls they import,
// which would otherwise render the parent's own tn-select/tn-checkbox as empty mocks.
ngMocks.globalKeep(TnFormSectionComponent, true);
ngMocks.globalKeep(TnFormFieldComponent, true);
ngMocks.globalKeep(TnInputComponent, true);
ngMocks.globalKeep(TnSelectComponent, true);
ngMocks.globalKeep(TnCheckboxComponent, true);

describe('DirectoryServicesConfigFormComponent', () => {
  let spectator: Spectator<DirectoryServicesFormComponent>;
  let loader: HarnessLoader;

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

  beforeEach(() => {
    spectator = createComponent();
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should require configuration type selection', async () => {
      const enable = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Service' }));
      await enable.check();
      const timeout = await loader.getHarness(TnInputHarness.with({ name: 'timeout' }));
      await timeout.setValue('60');

      // The configuration-type select is present but unset, so the form stays invalid and the
      // host-driven Save action (canSubmit) is disabled.
      const serviceType = await loader.getHarness(TnSelectHarness);
      expect(serviceType).toBeTruthy();
      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('should show Active Directory fields when AD configuration is selected', async () => {
      const serviceType = await loader.getHarness(TnSelectHarness);
      await serviceType.selectOption('Active Directory');
      spectator.detectChanges();

      expect(spectator.query(ActiveDirectoryConfigComponent)).toBeTruthy();
    });

    it('should show LDAP fields when LDAP configuration is selected', async () => {
      const serviceType = await loader.getHarness(TnSelectHarness);
      await serviceType.selectOption('LDAP');
      spectator.detectChanges();

      expect(spectator.query(LdapConfigComponent)).toBeTruthy();
    });

    it('should show IPA fields when IPA configuration is selected', async () => {
      const serviceType = await loader.getHarness(TnSelectHarness);
      await serviceType.selectOption('IPA');
      spectator.detectChanges();

      expect(spectator.query(IpaConfigComponent)).toBeTruthy();
    });
  });

  describe('clearing stale credential validation errors', () => {
    interface TestableComponent {
      form: FormGroup;
      onCredentialDataChanged: (data: unknown) => void;
      onCredentialValidityChanged: (isValid: boolean) => void;
    }

    function setBindPasswordError(component: TestableComponent): void {
      // FormErrorHandlerService maps credential errors (e.g. a wrong bind password) onto
      // the main form's service_type control via getFieldsMap().
      component.form.controls.service_type.setErrors({
        manualValidateError: true,
        manualValidateErrorMsg: 'The bind password is not correct.',
        ixManualValidateError: { message: 'The bind password is not correct.' },
      });
    }

    it('clears the manual error when the user edits the credential data', () => {
      const component = spectator.component as unknown as TestableComponent;
      setBindPasswordError(component);
      expect(component.form.controls.service_type.errors).not.toBeNull();

      component.onCredentialDataChanged({ username: 'Administrator', password: 'correct' });

      expect(component.form.controls.service_type.errors).toBeNull();
    });

    it('clears the manual error when credential validity changes', () => {
      const component = spectator.component as unknown as TestableComponent;
      setBindPasswordError(component);
      expect(component.form.controls.service_type.errors).not.toBeNull();

      component.onCredentialValidityChanged(true);

      expect(component.form.controls.service_type.errors).toBeNull();
    });
  });

  describe('clear config', () => {
    // "Clear Config" is now a side-panel footer action; the host container renders the button,
    // so the isolated component spec invokes the action's onClick directly.
    function clickClearConfig(): void {
      const action = spectator.component.footerActions.find((item) => item.testId === 'clear-config');
      action?.onClick();
    }

    it('should show confirmation dialog and call API when Clear Config is clicked', () => {
      clickClearConfig();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: 'Clear Directory Services Configuration',
        message: 'Directory service will be disabled and all settings will be lost. Are you sure you want to continue?',
        buttonText: 'Clear',
      });

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(mockSlideInRef.close).toHaveBeenCalledWith({ response: true });
    });

    it('should not call API when confirmation is cancelled', () => {
      const dialogService = spectator.inject(DialogService);
      (dialogService.confirm as jest.Mock).mockReturnValue(of(false));

      clickClearConfig();

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(dialogService.jobDialog).not.toHaveBeenCalled();
    });
  });
});
