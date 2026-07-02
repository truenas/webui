import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormGroup, FormControl, ReactiveFormsModule,
} from '@angular/forms';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
      mockProvider(FormSidePanelService, { open: jest.fn(() => SlideInResult.empty()) }),
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
      const select = await loader.getHarness(TnSelectHarness);
      await select.open();
      const optionLabels = await select.getOptions();
      expect(optionLabels).toEqual([
        'Add New',
        'AWS S3 (Amazon S3)',
        'Dropbox (Dropbox)',
        'Drive (Google Drive)',
      ]);
    });
  });

  describe('required validation', () => {
    it('carries the required validator on the inner control so the field can show the error', () => {
      defaultHostProps.form.controls.credentials.setValue(null);
      spectator = createHost(host, {
        hostProps: { ...defaultHostProps, label: 'Credentials', required: true },
      });
      spectator.detectChanges();

      // The wrapping tn-form-field reads validity from the inner tn-select (bound to selectControl),
      // not the host control — so the inner control must carry the validator for the inline required
      // error to surface on blur. This regressed when the migration moved the validator off it.
      const { selectControl } = spectator.component as unknown as { selectControl: FormControl };
      expect(selectControl.hasError('required')).toBe(true);
    });

    it('does not mark the inner control required when required is false', () => {
      spectator = createHost(host, {
        hostProps: { ...defaultHostProps, label: 'Credentials', required: false },
      });
      spectator.detectChanges();

      const { selectControl } = spectator.component as unknown as { selectControl: FormControl };
      expect(selectControl.hasError('required')).toBe(false);
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
      const select = await loader.getHarness(TnSelectHarness);
      await select.open();
      const optionLabels = await select.getOptions();
      expect(optionLabels).toEqual([
        'Add New',
        'AWS S3 (Amazon S3)',
      ]);
    });
  });

  describe('slide-in interactions', () => {
    it('should set form value and refetch options on successful slide-in', async () => {
      const newCredential = { id: '3', name: 'New Cred', provider: { type: CloudSyncProviderName.AmazonS3 } };
      const formPanel = { open: jest.fn(() => SlideInResult.success(newCredential)) };

      spectator = createHost(host, {
        hostProps: defaultHostProps,
        providers: [
          mockProvider(FormSidePanelService, formPanel),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const select = await loader.getHarness(TnSelectHarness);
      await select.selectOption('Add New');

      expect(formPanel.open).toHaveBeenCalled();
      const form = defaultHostProps.form;
      expect(form.value).toEqual({ credentials: '3' });
    });

    it('should restore previous value when slide-in is cancelled', async () => {
      const formPanel = { open: jest.fn(() => SlideInResult.cancel()) };

      spectator = createHost(host, {
        hostProps: defaultHostProps,
        providers: [
          mockProvider(FormSidePanelService, formPanel),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      defaultHostProps.form.controls.credentials.setValue('1');

      const select = await loader.getHarness(TnSelectHarness);
      await select.selectOption('Add New');

      expect(formPanel.open).toHaveBeenCalled();
      expect(defaultHostProps.form.value).toEqual({ credentials: '1' });
    });
  });
});
