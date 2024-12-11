import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CaCreateType } from 'app/enums/ca-create-type.enum';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  CaIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-identifier-and-type/ca-identifier-and-type.component';

describe('CaIdentifierAndTypeComponent', () => {
  let spectator: Spectator<CaIdentifierAndTypeComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const caProfile = {} as CertificateProfile;
  const openvpnProfile = {} as CertificateProfile;

  const createComponent = createComponentFactory({
    component: CaIdentifierAndTypeComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('webui.crypto.certificateauthority_profiles', {
          CA: caProfile,
          'OpenVPN Root CA': openvpnProfile,
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
        Name: 'New CA',
        Type: 'Internal CA',
        Profile: 'OpenVPN Root CA',
        'Add To Trusted Store': true,
      });
    });

    it('returns name and type when getPayload is called', () => {
      expect(spectator.component.getPayload()).toEqual({
        name: 'New CA',
        create_type: CaCreateType.Internal,
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
          value: 'New CA',
        },
        {
          label: 'Type',
          value: 'Internal CA',
        },
        {
          label: 'Profile',
          value: 'OpenVPN Root CA',
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
        Name: 'Import CA',
        Type: 'Import CA',
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
          value: 'Import CA',
        },
        {
          label: 'Type',
          value: 'Import CA',
        },
      ]);
    });
  });
});
