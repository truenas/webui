import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import {
  CertificateDetailsComponent,
} from 'app/pages/credentials/certificates-dash/certificate-details/certificate-details.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { WebSocketService } from 'app/services/ws.service';
import { CertificateAuthorityEditComponent } from './certificate-authority-edit.component';

describe('CertificateAuthorityEditComponent', () => {
  let spectator: Spectator<CertificateAuthorityEditComponent>;
  let loader: HarnessLoader;
  const certificateAuthority = {
    id: 1,
    name: 'ray',
    certificate: '--BEGIN CERTIFICATE--',
    privatekey: '--BEGIN RSA PRIVATE KEY--',
  } as CertificateAuthority;
  const createComponent = createComponentFactory({
    component: CertificateAuthorityEditComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('certificateauthority.update'),
      ]),
      mockProvider(MatDialog),
      mockProvider(SlideInRef),
      mockProvider(DialogService),
      mockAuth(),
      {
        provide: SLIDE_IN_DATA,
        useValue: certificateAuthority,
      },
    ],
    declarations: [
      MockComponent(ViewCertificateDialogComponent),
      MockComponent(CertificateDetailsComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the name of the certificate authority', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Identifier' }));
    expect(await nameInput.getValue()).toBe('ray');
  });

  it('shows details of a certificate authority', () => {
    const certificateDetails = spectator.query(CertificateDetailsComponent);
    expect(certificateDetails).toBeTruthy();
    expect(certificateDetails.certificate).toEqual(certificateAuthority);
  });

  it('saves authority name when it is changed and Save is pressed', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Identifier' }));
    await nameInput.setValue('New Name');

    const addToTrustedStoreCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Add to trusted store' }));
    await addToTrustedStoreCheckbox.setValue(true);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('certificateauthority.update', [1,
      { name: 'New Name', add_to_trusted_store: true },
    ]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('opens modal for authority certificate when View/Download Certificate is pressed', async () => {
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

  it('opens modals for authority key when View/Download Key is pressed', async () => {
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
