import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
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
});
