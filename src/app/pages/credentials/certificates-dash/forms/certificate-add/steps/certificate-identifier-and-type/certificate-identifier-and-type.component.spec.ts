import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CertificateIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';

describe('CertificateIdentifierAndTypeComponent', () => {
  let spectator: Spectator<CertificateIdentifierAndTypeComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const httpsProfile = {} as CertificateProfile;
  const openvpnProfile = {} as CertificateProfile;

  const createComponent = createComponentFactory({
    component: CertificateIdentifierAndTypeComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('webui.crypto.certificate_profiles', {
          'HTTPS ECC Certificate': httpsProfile,
          'Openvpn Client Certificate': openvpnProfile,
        }),
      ]),
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.component.profileSelected, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('creating new certificate', () => {
    beforeEach(async () => {
      await form.fillForm({
        Name: 'New Certificate',
        Type: 'Internal Certificate',
        Profile: 'Openvpn Client Certificate',
        'Add To Trusted Store': true,
      });
    });

    it('returns name and type when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        name: 'New Certificate',
        create_type: CertificateCreateType.CreateInternal,
        add_to_trusted_store: true,
      });
    });

    it('emits (profileSelected) when Profile is selected', () => {
      expect(spectator.component.profileSelected.emit).toHaveBeenCalledWith(openvpnProfile);
    });

    it('returns summary with Profile when getSummary is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Name',
          value: 'New Certificate',
        },
        {
          label: 'Type',
          value: 'Internal Certificate',
        },
        {
          label: 'Profile',
          value: 'Openvpn Client Certificate',
        },
        {
          label: 'Add To Trusted Store',
          value: 'Yes',
        },
      ]);
    });
  });

  describe('importing a certificate', () => {
    beforeEach(async () => {
      await form.fillForm({
        Name: 'Import Certificate',
        Type: 'Import Certificate',
      });
    });

    it('does not show a Profile field when Type is changed to Import', async () => {
      const fields = await form.getLabels();
      expect(fields).not.toContain('Profile');
    });

    it('returns summary with Name and Type when getSummary is called', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Name',
          value: 'Import Certificate',
        },
        {
          label: 'Type',
          value: 'Import Certificate',
        },
      ]);
    });
  });
});
