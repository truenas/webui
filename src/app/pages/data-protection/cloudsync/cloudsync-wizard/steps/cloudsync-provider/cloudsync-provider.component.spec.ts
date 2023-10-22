import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { BaseProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';
import { StorjProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncProviderComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';


const storjProvider = {
  name: CloudsyncProviderName.Storj,
  title: 'Storj iX',
  credentials_schema: [],
  credentials_oauth: null,
  buckets: true,
  bucket_title: 'Bucket',
  task_schema: [],
} as CloudsyncProvider;

const googlePhotosProvider = {
  name: CloudsyncProviderName.GooglePhotos,
  title: 'Google Photos',
  credentials_schema: [],
  credentials_oauth: null,
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
} as CloudsyncProvider;

const googlePhotosCreds = {
  id: 1,
  name: 'Google Photos',
  provider: CloudsyncProviderName.GooglePhotos,
  attributes: {
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
    token: 'test-token',
  },
};

jest.mock('app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component', () => {
  return {
    StorjProviderFormComponent: Component({
      selector: 'ix-storj-provider-form',
      template: '',
    })(class {
      provider: CloudsyncProvider;
      formPatcher$ = {
        next: jest.fn(),
      };
      getFormSetter$ = jest.fn(() => this.formPatcher$);
      getSubmitAttributes = jest.fn(() => ({
        access_key_id: 'test-key-id',
        secret_access_key: 'test-access-key',
      })) as BaseProviderFormComponent['getSubmitAttributes'];
      beforeSubmit = jest.fn(() => of(undefined)) as BaseProviderFormComponent['beforeSubmit'];
      form = {
        get invalid(): boolean {
          return false;
        },
      } as FormGroup;
    }),
  };
});

jest.mock('app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component', () => {
  return {
    GooglePhotosProviderFormComponent: Component({
      selector: 'ix-google-photos-provider-form',
      template: '',
    })(class {
      provider: CloudsyncProvider;
      formPatcher$ = {
        next: jest.fn(),
      };
      getFormSetter$ = jest.fn(() => this.formPatcher$);
      getSubmitAttributes = jest.fn(() => ({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        token: 'test-token',
      })) as BaseProviderFormComponent['getSubmitAttributes'];
      beforeSubmit = jest.fn(() => of(undefined)) as BaseProviderFormComponent['beforeSubmit'];
      form = {
        get invalid(): boolean {
          return false;
        },
      } as FormGroup;
    }),
  };
});

describe('CloudsyncProviderComponent', () => {
  let spectator: Spectator<CloudsyncProviderComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CloudsyncProviderComponent,
    imports: [ReactiveFormsModule, IxFormsModule],
    declarations: [
      GooglePhotosProviderFormComponent,
      StorjProviderFormComponent,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.providers', [storjProvider, googlePhotosProvider]),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
        mockCall('cloudsync.credentials.verify', {
          valid: true,
        }),
      ]),
      mockProvider(CloudCredentialService, {
        getCloudsyncCredentials: jest.fn(() => of([googlePhotosCreds])),
        getProviders: jest.fn(() => of([storjProvider, googlePhotosProvider])),
      }),
      mockProvider(IxSlideInService),
      mockProvider(DatasetService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads a list of providers and shows them in Provider select', async () => {
    expect(spectator.inject(CloudCredentialService).getProviders).toHaveBeenCalledWith();

    const providersSelect = await form.getControl('Provider') as IxSelectHarness;
    expect(await providersSelect.getOptionLabels()).toEqual(['Storj iX', 'Google Photos']);
  });

  it('renders dynamic provider specific form when Provider is selected', async () => {
    const providersSelect = await form.getControl('Provider') as IxSelectHarness;
    await providersSelect.setValue('Google Photos');

    const providerForm = spectator.query(GooglePhotosProviderFormComponent);
    expect(providerForm).toBeTruthy();
    expect(providerForm.provider).toBe(googlePhotosProvider);
  });

  it('returns fields default value when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      provider: CloudsyncProviderName.Storj,
      attributes: {
        access_key_id: 'test-key-id',
        secret_access_key: 'test-access-key',
      },
      name: 'Storj',
    });
  });

  it('when an existing name is entered, the "Next" button is disabled', async () => {
    const nextButton = await loader.getHarness(MatButtonHarness.with({ text: 'Next' }));

    await form.fillForm({ 'Name': 'Google Photos - testUser' });
    expect(await nextButton.isDisabled()).not.toBeDisabled();
  });

  it('opens an advanced form when Advanced Options is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedButton.click();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudsyncFormComponent, { wide: true });
  });

  describe('verification', () => {
    it('verifies entered values when user presses Verify', async () => {
      await form.fillForm({
        'Provider': 'Google Photos',
      });

      const verifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Verify Credential' }));
      await verifyButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.credentials.verify', [{
        provider: 'GOOGLE_PHOTOS',
        attributes: {
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          token: 'test-token',
        },
      }]);
    });

    it('calls beforeSubmit before verifying entered values', async () => {
      await form.fillForm({
        'Name': 'Google Photos - testUser',
        'Provider': 'Google Photos',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Verify Credential' }));
      await saveButton.click();

      const providerForm = spectator.query(GooglePhotosProviderFormComponent);
      expect(providerForm.beforeSubmit).toHaveBeenCalled();
    });

    it('shows an error when verification fails', async () => {
      const websocketMock = spectator.inject(MockWebsocketService);
      websocketMock.mockCall('cloudsync.credentials.verify', {
        valid: false,
        excerpt: 'Missing some important field',
        error: 'Some error',
      });

      await form.fillForm({
        Name: 'Google Photos - test credential',
        Provider: 'Google Photos',
      });

      const verifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Verify Credential' }));
      await verifyButton.click();

      expect(spectator.inject(DialogService).error).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Missing some important field',
        backtrace: expect.anything(),
      });
    });
  });
});
