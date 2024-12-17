import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
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
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { CertificateEditComponent } from './certificate-edit.component';

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

  const createComponent = createComponentFactory({
    component: CertificateEditComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('certificate.update'),
      ]),
      mockProvider(MatDialog),
      mockProvider(SlideInService),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockProvider(DialogService),
      mockAuth(),
    ],
    declarations: [
      MockComponent(ViewCertificateDialogComponent),
      MockComponent(CertificateDetailsComponent),
      MockComponent(CertificateAcmeAddComponent),
    ],
  });

  describe('Edit certificate', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: certificate },
        ],
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows the name of the certificate', async () => {
      const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Identifier' }));
      expect(await nameInput.getValue()).toBe('ray');
    });

    it('hides the renew_days input of the certificate if it is not acme', async () => {
      const renewDaysInput = await loader.getHarnessOrNull(IxInputHarness.with({ label: 'Renew Certificate Days Before Expiry' }));
      expect(renewDaysInput).not.toExist();
    });

    it('shows details of a certificate', () => {
      const certificateDetails = spectator.query(CertificateDetailsComponent);
      expect(certificateDetails).toBeTruthy();
      expect(certificateDetails.certificate).toEqual(certificate);
      expect(certificateDetails.showSignedBy).toBe(true);
    });

    it('saves certificate name when it is changed and Save is pressed', async () => {
      const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Identifier' }));
      await nameInput.setValue('New Name');

      const addToTrustedStoreCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Add to trusted store' }));
      await addToTrustedStoreCheckbox.setValue(true);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.update', [1,
        { name: 'New Name', add_to_trusted_store: true },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('opens modal for certificate when View/Download Certificate is pressed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'View/Download Certificate' }));
      await button.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ViewCertificateDialogComponent, {
        data: {
          certificate: '--BEGIN CERTIFICATE--',
          name: 'ray',
          extension: 'crt',
        } as ViewCertificateDialogData,
      });
    });

    it('opens modals for certificate key when View/Download Key is pressed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'View/Download Key' }));
      await button.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ViewCertificateDialogComponent, {
        data: {
          certificate: '--BEGIN RSA PRIVATE KEY--',
          name: 'ray',
          extension: 'crt',
        } as ViewCertificateDialogData,
      });
    });
  });

  describe('Edit acme certificate', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              ...certificate,
              acme: true,
            },
          },
        ],
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows the renew_days input for acme certificate', async () => {
      const renewDaysInput = await loader.getHarness(IxInputHarness.with({ label: 'Renew Certificate Days Before Expiry' }));
      expect(await renewDaysInput.getValue()).toBe('');
    });

    it('shows add to trusted store checkbox for ACME certificate', async () => {
      const addToTrustedStoreCheckbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Add to trusted store' }));
      expect(addToTrustedStoreCheckbox).toExist();
    });
  });

  describe('CSR', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: certificateCsr,
          },
        ],
      });
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show add to trusted store checkbox for CSR', async () => {
      const addToTrustedStoreCheckbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Add to trusted store' }));
      expect(addToTrustedStoreCheckbox).not.toExist();
    });

    it('opens slidein for creating ACME certificates when Create ACME Certificate is pressed', async () => {
      const slideInService = spectator.inject(SlideInService);
      const mockSetCsr = jest.fn();
      slideInService.open.mockReturnValue({
        componentInstance: {
          setCsr: mockSetCsr,
        },
        slideInClosed$: of({}),
      } as SlideInRef<unknown>);
      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create ACME Certificate' }));
      await createButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(slideInService.open).toHaveBeenCalledWith(
        CertificateAcmeAddComponent,
        { data: spectator.component.certificate },
      );
    });
  });
});
