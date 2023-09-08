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
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
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
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
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
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockJob('certificate.update'),
      ]),
      mockProvider(MatDialog),
      mockProvider(IxSlideInService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockProvider(DialogService),
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

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('certificate.update', [1, { name: 'New Name' }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
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

    it('opens slidein for creating ACME certificates when Create ACME Certificate is pressed', async () => {
      const slideInService = spectator.inject(IxSlideInService);
      const mockSetCsr = jest.fn();
      slideInService.open.mockReturnValue({
        componentInstance: {
          setCsr: mockSetCsr,
        },
        slideInClosed$: of({}),
      } as IxSlideInRef<unknown>);
      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create ACME Certificate' }));
      await createButton.click();

      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
      expect(slideInService.open).toHaveBeenCalledWith(
        CertificateAcmeAddComponent,
        { data: spectator.component.certificate },
      );
    });
  });
});
