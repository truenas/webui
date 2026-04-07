import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormGroup, FormControl, ReactiveFormsModule,
} from '@angular/forms';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { CloudCredentialService } from 'app/services/cloud-credential.service';

describe('CloudCredentialsSelectComponent', () => {
  let spectator: SpectatorHost<CloudCredentialsSelectComponent>;
  let loader: HarnessLoader;

  const host = `
    <form [formGroup]="form">
      <ix-cloud-credentials-select
        formControlName="credentials"
        [label]="label"
        [tooltip]="tooltip"
        [filterByProviders]="filterByProviders"
        [required]="required"
      ></ix-cloud-credentials-select>
    </form>
  `;

  const defaultHostProps = {
    form: new FormGroup({
      credentials: new FormControl(),
    }),
    label: '',
    required: false,
    tooltip: '',
  };

  const mockCredentials = [
    { id: '1', name: 'AWS S3', provider: { type: CloudSyncProviderName.AmazonS3 } },
    { id: '2', name: 'Dropbox', provider: { type: CloudSyncProviderName.Dropbox } },
    { id: '2', name: 'Drive', provider: { type: CloudSyncProviderName.GoogleDrive } },
  ];

  const mockCloudCredentialService = {
    getCloudSyncCredentials: jest.fn(() => of(mockCredentials)),
  };

  const createHost = createHostFactory({
    component: CloudCredentialsSelectComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CloudCredentialService, mockCloudCredentialService),
      mockProvider(SlideIn, { open: jest.fn(() => SlideInResult.empty()) }),
    ],
  });

  describe('no filter by providers set', () => {
    beforeEach(() => {
      spectator = createHost(host, {
        hostProps: defaultHostProps,
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should populate ix-select with credentials when providers are set', async () => {
      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual([
        '--',
        'Add New',
        'AWS S3 (Amazon S3)',
        'Dropbox (Dropbox)',
        'Drive (Google Drive)',
      ]);
    });
  });

  describe('filter by providers is set', () => {
    beforeEach(() => {
      spectator = createHost(host, {
        hostProps: {
          ...defaultHostProps,
          filterByProviders: [CloudSyncProviderName.AmazonS3],
        },
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should populate ix-select with credentials when providers are set', async () => {
      const select = await (await loader.getHarness(IxSelectHarness)).getSelectHarness();
      await select.open();
      const options = await select.getOptions();
      const optionLabels = await parallel(() => options.map((option) => option.getText()));
      expect(optionLabels).toEqual([
        '--',
        'Add New',
        'AWS S3 (Amazon S3)',
      ]);
    });
  });

  describe('slide-in interactions', () => {
    it('should set form value and refetch options on successful slide-in', async () => {
      const newCredential = { id: '3', name: 'New Cred', provider: { type: CloudSyncProviderName.AmazonS3 } };
      const slideIn = { open: jest.fn(() => SlideInResult.success(newCredential)) };

      spectator = createHost(host, {
        hostProps: defaultHostProps,
        providers: [
          mockProvider(SlideIn, slideIn),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const select = await loader.getHarness(IxSelectHarness);
      await select.setValue('Add New');

      expect(slideIn.open).toHaveBeenCalled();
      const form = defaultHostProps.form;
      expect(form.value).toEqual({ credentials: '3' });
    });

    it('should restore previous value when slide-in is cancelled', async () => {
      const slideIn = { open: jest.fn(() => SlideInResult.cancel()) };

      spectator = createHost(host, {
        hostProps: defaultHostProps,
        providers: [
          mockProvider(SlideIn, slideIn),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      defaultHostProps.form.controls.credentials.setValue('1');

      const select = await loader.getHarness(IxSelectHarness);
      await select.setValue('Add New');

      expect(slideIn.open).toHaveBeenCalled();
      expect(defaultHostProps.form.value).toEqual({ credentials: '1' });
    });
  });
});
