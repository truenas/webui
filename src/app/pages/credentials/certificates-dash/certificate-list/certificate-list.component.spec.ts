import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness,
  TnIconButtonHarness,
  TnMenuHarness,
  TnMenuTesting,
  TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CertificateEditComponent } from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { ImportCertificateComponent } from 'app/pages/credentials/certificates-dash/import-certificate/import-certificate.component';
import { StorageService } from 'app/services/storage.service';
import { CertificateListComponent } from './certificate-list.component';

const certificates = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  type: 8,
  name: `cert_default_${index}`,
  certificate: '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----\n',
  privatekey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWjoaj0WEOn1yQ\n-----END PRIVATE KEY-----\n',
  CSR: null as string | null,
  cert_type: 'CERTIFICATE',
  key_length: 2048,
  key_type: 'RSA',
  common: 'localhost',
  san: ['DNS:localhost'],
  digest_algorithm: 'SHA256',
  lifetime: 397,
  from: 'Tue Jun 20 06:55:04 2023',
  until: 'Sun Jun 20 06:55:04 2024',
  serial: 878189416,
  chain: false,
  parsed: true,
})) as Certificate[];

describe('CertificateListComponent', () => {
  let spectator: Spectator<CertificateListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: CertificateListComponent,
    providers: [
      mockApi([
        mockJob('certificate.delete', fakeSuccessfulJob(true)),
        mockJob('certificate.update', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => {
          return of({ confirmed: true, secondaryCheckbox: true });
        }),
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(undefined)),
        })),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(StorageService),
      mockProvider(SnackbarService),
      mockAuth(),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const [trigger] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        certificates,
        isLoading: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('checks page title', () => {
    expect(spectator.query('h3')).toHaveText('Certificates');
  });

  it('makes the data columns sortable and the actions column not', async () => {
    expect(await table.isSortable('name')).toBe(true);
    expect(await table.isSortable('from')).toBe(true);
    expect(await table.isSortable('common')).toBe(true);
    expect(await table.isSortable('actions')).toBe(false);
  });

  it('sorts when a column header is clicked', async () => {
    await table.clickSortHeader('name');
    expect(await table.getSortDirection('name')).toBe('ascending');
  });

  it('opens certificate import form when "Import" button is pressed', async () => {
    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(ImportCertificateComponent, {
      title: 'Import Certificate',
      saveLabel: 'Import',
    });
  });

  it('opens certificate edit form when "Edit" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /Edit/ });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(CertificateEditComponent, {
      wide: true,
      title: 'Edit Certificate',
      inputs: { editingCertificate: certificates[0] },
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /Delete/ });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete Certificate',
      message: `Are you sure you want to delete "${certificates[0].name}"?`,
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Force',
      buttonColor: 'warn',
      buttonText: 'Delete',
    });
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.delete', [certificates[0].id, true]);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Date', 'CN', '']);

    const rows = await table.getAllRowTexts();
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual([
      'cert_default_0', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', '',
    ]);
  });

  it('emits certificatesUpdated when import succeeds', async () => {
    const certificatesUpdatedSpy = jest.fn();
    spectator.output('certificatesUpdated').subscribe(certificatesUpdatedSpy);

    jest.spyOn(spectator.inject(FormSidePanelService), 'open').mockReturnValue(SlideInResult.success(true));

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(certificatesUpdatedSpy).toHaveBeenCalled();
  });

  it('emits certificatesUpdated when edit succeeds', async () => {
    const certificatesUpdatedSpy = jest.fn();
    spectator.output('certificatesUpdated').subscribe(certificatesUpdatedSpy);

    jest.spyOn(spectator.inject(FormSidePanelService), 'open').mockReturnValue(SlideInResult.success(true));

    const menu = await openRowMenu();
    await menu.clickItem({ label: /Edit/ });

    expect(certificatesUpdatedSpy).toHaveBeenCalled();
  });

  it('emits certificatesUpdated and shows snackbar when delete succeeds', async () => {
    const certificatesUpdatedSpy = jest.fn();
    spectator.output('certificatesUpdated').subscribe(certificatesUpdatedSpy);

    const menu = await openRowMenu();
    await menu.clickItem({ label: /Delete/ });

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Certificate deleted');
    expect(certificatesUpdatedSpy).toHaveBeenCalled();
  });
});
