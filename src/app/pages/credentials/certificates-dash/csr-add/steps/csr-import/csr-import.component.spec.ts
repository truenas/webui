import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  CsrImportComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-import/csr-import.component';

describe('CsrImportComponent', () => {
  let spectator: Spectator<CsrImportComponent>;
  let loader: HarnessLoader;

  const csr = '-----BEGIN CERTIFICATE REQUEST-----\n'
    + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
    + '-----END CERTIFICATE REQUEST-----';

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  async function setInputs(values: Record<string, string>): Promise<void> {
    for (const [name, value] of Object.entries(values)) {
      if (value.trim() === '') {
        (spectator.component.form.controls as Record<string, AbstractControl>)[name].setValue(value);
      } else {
        await (await getInput(name)).setValue(value);
      }
    }
  }

  const createComponent = createComponentFactory({
    component: CsrImportComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await setInputs({
      CSR: csr,
      privatekey: 'ABHDDJJKEY',
      passphrase: '123456',
      passphrase2: '123456',
    });
  });

  it('returns fields to import certificate when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      CSR: csr,
      passphrase: '123456',
      privatekey: 'ABHDDJJKEY',
    });
  });

  it('returns summary when getSummary() is called', () => {
    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'Signing Request',
        value: 'ABCDEF......654321',
      },
      {
        label: 'Passphrase',
        value: 'With passphrase',
      },
    ]);
  });

  it('converts empty strings to null in getPayload()', async () => {
    await setInputs({
      CSR: csr,
      privatekey: '',
      passphrase: '',
      passphrase2: '',
    });

    expect(spectator.component.getPayload()).toEqual({
      CSR: csr,
      passphrase: null,
      privatekey: null,
    });
  });

  it('returns summary without passphrase when passphrase is empty', async () => {
    await setInputs({
      CSR: csr,
      privatekey: 'ABHDDJJKEY',
      passphrase: '',
      passphrase2: '',
    });

    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'Signing Request',
        value: 'ABCDEF......654321',
      },
    ]);
  });

  it('handles whitespace-only strings by converting to null', async () => {
    await setInputs({
      CSR: csr,
      privatekey: '   ',
      passphrase: ' \t ',
      passphrase2: ' \t ',
    });

    const payload = spectator.component.getPayload();
    expect(payload.passphrase).toBeNull();
    expect(payload.privatekey).toBeNull();
  });

  it('preserves non-empty values correctly', async () => {
    const privateKey = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
    const passphrase = 'my-secure-passphrase';

    await setInputs({
      CSR: csr,
      privatekey: privateKey,
      passphrase,
      passphrase2: passphrase,
    });

    expect(spectator.component.getPayload()).toEqual({
      CSR: csr,
      passphrase,
      privatekey: privateKey,
    });
  });
});
