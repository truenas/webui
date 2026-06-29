import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ImportCertificateComponent } from './import-certificate.component';

describe('ImportCertificateComponent', () => {
  let spectator: Spectator<ImportCertificateComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ImportCertificateComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideInRef, {
        requireConfirmationWhen: () => of(false),
        getData: () => undefined,
        close: jest.fn(),
      }),
      mockApi([
        mockJob('certificate.create'),
      ]),
      mockProvider(SnackbarService),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('imports certificate with password', async () => {
    await (await getInput('name')).setValue('test-cert-with-password');
    await (await getCheckbox('add_to_trusted_store')).check();
    await (await getInput('certificate')).setValue('--BEING CERTIFICATE--');
    await (await getInput('privatekey')).setValue('--BEING PRIVATE KEY--');
    await (await getInput('passphrase')).setValue('secret123');
    await (await getInput('passphrase2')).setValue('secret123');

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'test-cert-with-password',
      add_to_trusted_store: true,
      certificate: '--BEING CERTIFICATE--',
      privatekey: '--BEING PRIVATE KEY--',
      passphrase: 'secret123',
      create_type: CertificateCreateType.Import,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
  });

  it('imports certificate without password', async () => {
    await (await getInput('name')).setValue('test-cert-no-password');
    await (await getInput('certificate')).setValue('--BEING CERTIFICATE--');
    await (await getInput('privatekey')).setValue('--BEING PRIVATE KEY--');

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'test-cert-no-password',
      add_to_trusted_store: false,
      certificate: '--BEING CERTIFICATE--',
      privatekey: '--BEING PRIVATE KEY--',
      passphrase: null,
      create_type: CertificateCreateType.Import,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
  });

  it('imports certificate with empty private key', async () => {
    await (await getInput('name')).setValue('test-cert-no-private-key');
    await (await getInput('certificate')).setValue('--BEING CERTIFICATE--');

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('certificate.create', [{
      name: 'test-cert-no-private-key',
      add_to_trusted_store: false,
      certificate: '--BEING CERTIFICATE--',
      privatekey: null,
      passphrase: null,
      create_type: CertificateCreateType.Import,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
  });
});
