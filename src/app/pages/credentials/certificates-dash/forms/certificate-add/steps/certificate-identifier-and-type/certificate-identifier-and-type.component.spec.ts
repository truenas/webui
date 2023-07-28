import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  CertificateIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import { DialogService } from 'app/services/dialog.service';

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
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('certificate.profiles', {
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
      });
    });

    it('returns name and type when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        name: 'New Certificate',
        create_type: CertificateCreateType.CreateInternal,
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
