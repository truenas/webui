import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { CertificateAcmeAddComponent } from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import { CertificateEditComponent } from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { CsrAddComponent } from 'app/pages/credentials/certificates-dash/csr-add/csr-add.component';
import { CertificateSigningRequestsListComponent } from 'app/pages/credentials/certificates-dash/csr-list/csr-list.component';
import { StorageService } from 'app/services/storage.service';

const csrs = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  type: 8,
  name: `cert_default_${index}`,
  certificate: '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----\n',
  privatekey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWjoaj0WEOn1yQ\n-----END PRIVATE KEY-----\n',
  CSR: '--BEGIN CERTIFICATE REQUEST--',
  cert_type_CSR: true,
  cert_type: 'CERTIFICATE',
  common: 'localhost',
  san: [
    'DNS:localhost',
  ],
  digest_algorithm: 'SHA256',
  lifetime: 397,
  from: 'Tue Jun 20 06:55:04 2023',
  until: 'Sun Jun 20 06:55:04 2024',
})) as Certificate[];

describe('CertificateSigningRequestsListComponent', () => {
  let spectator: Spectator<CertificateSigningRequestsListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let slideIn: SlideIn;
  let formPanel: FormSidePanelService;

  const createComponent = createComponentFactory({
    component: CertificateSigningRequestsListComponent,
    providers: [
      mockApi([
        mockJob('certificate.delete', fakeSuccessfulJob(true)),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({ confirmed: true, secondaryCheckbox: false })),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(fakeSuccessfulJob()),
        })),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(SlideInRef),
      mockProvider(StorageService),
      mockAuth(),
    ],
  });

  async function openFirstRowMenu(): Promise<TnMenuHarness> {
    const [trigger] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        csrs,
        isLoading: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
    slideIn = spectator.inject(SlideIn);
    formPanel = spectator.inject(FormSidePanelService);
  });

  it('checks page title', () => {
    expect(spectator.query('.tn-card__title')).toHaveText('Certificate Signing Requests');
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'CN', '']);
    expect(await table.getAllRowTexts()).toEqual(
      csrs.map((csr) => [csr.name, 'CN:localhostSAN:DNS:localhost', '']),
    );
  });

  it('opens csr add form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(slideIn.open).toHaveBeenCalledWith(CsrAddComponent);
  });

  it('opens certificate edit form when "Edit" is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(formPanel.open).toHaveBeenCalledWith(CertificateEditComponent, {
      wide: true,
      title: 'Edit CSR',
      inputs: { editingCertificate: csrs[0] },
    });
  });

  it('opens ACME certificate form when "Create ACME Certificate" is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Create ACME Certificate' });

    expect(formPanel.open).toHaveBeenCalledWith(CertificateAcmeAddComponent, {
      title: 'Create ACME Certificate',
      inputs: { csr: csrs[0] },
    });
  });

  it('deletes the CSR when Delete is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete Certificate',
      message: `Are you sure you want to delete "${csrs[0].name}"?`,
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Force',
      buttonColor: 'warn',
      buttonText: 'Delete',
    });
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.delete', [csrs[0].id, false]);
  });

  it('emits csrsUpdated when add succeeds', async () => {
    const csrsUpdatedSpy = jest.fn();
    spectator.output('csrsUpdated').subscribe(csrsUpdatedSpy);

    jest.spyOn(slideIn, 'open').mockReturnValue(SlideInResult.success(true));

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(csrsUpdatedSpy).toHaveBeenCalled();
  });

  it('emits csrsUpdated when edit succeeds', async () => {
    const csrsUpdatedSpy = jest.fn();
    spectator.output('csrsUpdated').subscribe(csrsUpdatedSpy);

    jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(true));

    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(csrsUpdatedSpy).toHaveBeenCalled();
  });

  it('emits csrsUpdated when delete succeeds', async () => {
    const csrsUpdatedSpy = jest.fn();
    spectator.output('csrsUpdated').subscribe(csrsUpdatedSpy);

    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(csrsUpdatedSpy).toHaveBeenCalled();
  });

  it('emits csrsUpdated when ACME cert creation succeeds', async () => {
    const csrsUpdatedSpy = jest.fn();
    spectator.output('csrsUpdated').subscribe(csrsUpdatedSpy);

    jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(true));

    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Create ACME Certificate' });

    expect(formPanel.open).toHaveBeenCalledWith(CertificateAcmeAddComponent, {
      title: 'Create ACME Certificate',
      inputs: { csr: csrs[0] },
    });
    expect(csrsUpdatedSpy).toHaveBeenCalled();
  });
});
