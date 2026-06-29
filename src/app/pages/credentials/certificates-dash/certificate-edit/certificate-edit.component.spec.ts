import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxComponent, TnCheckboxHarness, TnDialog, TnFormFieldComponent, TnInputHarness,
} from '@truenas/ui-components';
import { MockComponent, ngMocks } from 'ng-mocks';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import {
  CertificateDetailsComponent,
} from 'app/pages/credentials/certificates-dash/certificate-details/certificate-details.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialog,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { CertificateEditComponent } from './certificate-edit.component';

// Mocking the dialog/details/acme children deep-mocks `tn-checkbox` across the
// TestBed (only `tn-input` is kept real globally in setup-jest), blanking the
// real `add_to_trusted_store` checkbox. Keep the lightweight checkbox real here.
ngMocks.globalKeep(TnCheckboxComponent);
// `tn-form-field` uses signal-based content queries that crash when auto-mocked
// by ng-mocks; render it real so the form template initializes.
ngMocks.globalKeep(TnFormFieldComponent);

describe('CertificateEditComponent', () => {
  let spectator: Spectator<CertificateEditComponent>;
  let loader: HarnessLoader;
  const certificate = {
    id: 1,
    name: 'ray',
    certificate: '--BEGIN CERTIFICATE--',
    privatekey: '--BEGIN RSA PRIVATE KEY--',
  } as Certificate;
  const certificateCsr = {
    ...certificate,
    cert_type_CSR: true,
    CSR: '--BEGIN CERTIFICATE REQUEST--',
  };

  const slideInRef: SlideInRef<Certificate | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
    swap: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: CertificateEditComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('certificate.update'),
      ]),
      mockProvider(TnDialog),
      mockProvider(SlideIn),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService),
      mockAuth(),
    ],
    declarations: [
      MockComponent(ViewCertificateDialog),
      MockComponent(CertificateDetailsComponent),
      MockComponent(CertificateAcmeAddComponent),
    ],
  });

  describe('Edit certificate', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => certificate) }),
        ],
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows the name of the certificate', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="name"]' }));
      expect(await nameInput.getValue()).toBe('ray');
    });

    it('hides the renew_days input of the certificate if it is not acme', async () => {
      const renewDaysInput = await loader.getHarnessOrNull(TnInputHarness.with({ selector: '[formControlName="renew_days"]' }));
      expect(renewDaysInput).toBeNull();
    });

    it('shows details of a certificate', () => {
      const certificateDetails = spectator.query(CertificateDetailsComponent)!;
      expect(certificateDetails).toBeTruthy();
      expect(certificateDetails.certificate).toEqual(certificate);
    });

    it('saves certificate name when it is changed and Save is pressed', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="name"]' }));
      await nameInput.setValue('New Name');

      const addToTrustedStoreCheckbox = await loader.getHarness(
        TnCheckboxHarness.with({ selector: '[formControlName="add_to_trusted_store"]' }),
      );
      await addToTrustedStoreCheckbox.check();

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.update', [1,
        { name: 'New Name', add_to_trusted_store: true },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('opens modal for certificate when View/Download Certificate is pressed', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: 'View/Download Certificate' }));
      await button.click();

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ViewCertificateDialog, {
        data: {
          certificate: '--BEGIN CERTIFICATE--',
          name: 'ray',
          extension: 'crt',
          mimeType: 'application/x-x509-user-cert',
        } as ViewCertificateDialogData,
      });
    });

    it('opens modals for certificate key when View/Download Key is pressed', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: 'View/Download Key' }));
      await button.click();

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ViewCertificateDialog, {
        data: {
          certificate: '--BEGIN RSA PRIVATE KEY--',
          name: 'ray',
          extension: 'key',
          mimeType: 'application/x-pem-file',
        } as ViewCertificateDialogData,
      });
    });
  });

  describe('Edit acme certificate', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ ...certificate, acme: true })) }),
        ],
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows the renew_days input for acme certificate', async () => {
      const renewDaysInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="renew_days"]' }));
      expect(await renewDaysInput.getValue()).toBe('');
    });

    it('shows add to trusted store checkbox for ACME certificate', async () => {
      const addToTrustedStoreCheckbox = await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="add_to_trusted_store"]' }),
      );
      expect(addToTrustedStoreCheckbox).not.toBeNull();
    });
  });

  describe('CSR', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => certificateCsr) }),
        ],
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show add to trusted store checkbox for CSR', async () => {
      const addToTrustedStoreCheckbox = await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="add_to_trusted_store"]' }),
      );
      expect(addToTrustedStoreCheckbox).toBeNull();
    });

    it('opens modal for CSR when View/Download CSR is pressed', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: 'View/Download CSR' }));
      await button.click();

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ViewCertificateDialog, {
        data: {
          certificate: '--BEGIN CERTIFICATE REQUEST--',
          name: 'ray',
          extension: 'csr',
          mimeType: 'application/pkcs10',
        } as ViewCertificateDialogData,
      });
    });

    it('opens SlideIn for creating ACME certificates when Create ACME Certificate is pressed', async () => {
      const createButton = await loader.getHarness(TnButtonHarness.with({ label: 'Create ACME Certificate' }));
      await createButton.click();

      expect(slideInRef.swap).toHaveBeenCalledWith(
        CertificateAcmeAddComponent,
      );
    });

    it('exposes the View/Download and Create ACME actions as a footer menu for the tn-side-panel host', () => {
      const menu = spectator.component.footerMenu;
      expect(menu?.label).toBe('Actions');
      expect(menu?.items.map((item) => item.label)).toEqual([
        'View/Download CSR',
        'View/Download Key',
        'Create ACME Certificate',
      ]);
      expect(menu?.items.map((item) => item.testId)).toEqual([
        'view-certificate-or-csr',
        'view-key',
        'create-acme-certificate',
      ]);
    });
  });
});
