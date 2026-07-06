import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CsrIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-identifier-and-type/csr-identifier-and-type.component';

describe('CsrIdentifierAndTypeComponent', () => {
  let spectator: Spectator<CsrIdentifierAndTypeComponent>;
  let loader: HarnessLoader;

  const selectValue = async (name: string, label: string): Promise<void> => {
    const select = await loader.getHarness(
      TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
    );
    await select.selectOption(label);
  };

  const httpsProfile = {} as CertificateProfile;
  const openvpnProfile = {} as CertificateProfile;

  const createComponent = createComponentFactory({
    component: CsrIdentifierAndTypeComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('webui.crypto.csr_profiles', {
          'HTTPS ECC Certificate': httpsProfile,
          'Openvpn Client Certificate': openvpnProfile,
        }),
      ]),
      mockProvider(DialogService),
    ],
  });

  const setName = async (value: string): Promise<void> => {
    const name = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="name"]' }));
    await name.setValue(value);
  };

  beforeEach(() => {
    spectator = createComponent();
    jest.spyOn(spectator.component.profileSelected, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('creating new CSR', () => {
    beforeEach(async () => {
      await setName('New');
      await selectValue('create_type', 'Certificate Signing Request');
      await selectValue('profile', 'Openvpn Client Certificate');
    });

    it('returns name and type when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        name: 'New',
        create_type: CertificateCreateType.CreateCsr,
      });
    });

    it('emits (profileSelected) when Profile is selected', () => {
      expect(spectator.component.profileSelected.emit).toHaveBeenCalledWith(openvpnProfile);
    });

    it('returns summary with Profile when getSummary is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Name',
          value: 'New',
        },
        {
          label: 'Type',
          value: 'Certificate Signing Request',
        },
        {
          label: 'Profile',
          value: 'Openvpn Client Certificate',
        },
      ]);
    });
  });

  describe('importing a certificate', () => {
    beforeEach(async () => {
      await setName('Import');
      await selectValue('create_type', 'Import Certificate Signing Request');
    });

    it('does not show a Profile field when Type is changed to Import', async () => {
      const profileSelect = await loader.getHarnessOrNull(
        TnSelectHarness.with({ selector: '[formControlName="profile"]' }),
      );
      expect(profileSelect).toBeNull();
    });

    it('returns summary with Name and Type when getSummary is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Name',
          value: 'Import',
        },
        {
          label: 'Type',
          value: 'Import Certificate Signing Request',
        },
      ]);
    });
  });
});
