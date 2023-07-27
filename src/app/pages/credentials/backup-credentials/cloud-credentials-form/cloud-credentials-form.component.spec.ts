// eslint-disable-next-line max-classes-per-file
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';
import {
  TokenProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/token-provider-form/token-provider-form.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { CloudCredentialsFormComponent } from './cloud-credentials-form.component';

jest.mock('./provider-forms/s3-provider-form/s3-provider-form.component', () => {
  return {
    S3ProviderFormComponent: Component({
      template: '',
    })(class {
      provider: CloudsyncProvider;
      formPatcher$ = {
        next: jest.fn(),
      };
      getFormSetter$ = jest.fn(() => this.formPatcher$);
      getSubmitAttributes = jest.fn(() => ({
        s3attribute: 's3 value',
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

jest.mock('./provider-forms/token-provider-form/token-provider-form.component', () => {
  return {
    TokenProviderFormComponent: Component({
      template: '',
    })(class {
      provider: CloudsyncProvider;
    }),
  };
});

describe('CloudCredentialsFormComponent', () => {
  let spectator: Spectator<CloudCredentialsFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const s3Provider = {
    name: CloudsyncProviderName.AmazonS3,
    title: 'Amazon S3',
  } as CloudsyncProvider;
  const boxProvider = {
    name: CloudsyncProviderName.Box,
    title: 'Box',
  } as CloudsyncProvider;
  const fakeCloudsyncCredential = {
    id: 233,
    name: 'My backup server',
    provider: CloudsyncProviderName.AmazonS3,
    attributes: {
      hostname: 'backup.com',
    },
  } as CloudsyncCredential;

  const createComponent = createComponentFactory({
    component: CloudCredentialsFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      TokenProviderFormComponent,
      S3ProviderFormComponent,
    ],
    providers: [
      mockProvider(IxSlideInRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockWebsocket([
        mockCall('cloudsync.credentials.create'),
        mockCall('cloudsync.credentials.update'),
        mockCall('cloudsync.credentials.verify', {
          valid: true,
        }),
        mockCall('cloudsync.providers', [s3Provider, boxProvider]),
      ]),
    ],
  });

  describe('rendering', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('loads a list of providers and shows them in Provider select', async () => {
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.providers');

      const providersSelect = await form.getControl('Provider') as IxSelectHarness;
      expect(await providersSelect.getOptionLabels()).toEqual(['Amazon S3', 'Box']);
    });

    it('renders dynamic provider specific form when Provider is selected', async () => {
      const providersSelect = await form.getControl('Provider') as IxSelectHarness;
      await providersSelect.setValue('Amazon S3');

      const providerForm = spectator.query(S3ProviderFormComponent);
      expect(providerForm).toBeTruthy();
      expect(providerForm.provider).toBe(s3Provider);
    });

    it('renders a token only form for some providers', async () => {
      const providersSelect = await form.getControl('Provider') as IxSelectHarness;
      await providersSelect.setValue('Box');

      const providerForm = spectator.query(TokenProviderFormComponent);
      expect(providerForm).toBeTruthy();
      expect(providerForm.provider).toBe(boxProvider);
    });

    describe('verification', () => {
      it('verifies entered values when user presses Verify', async () => {
        await form.fillForm({
          Name: 'New sync',
          Provider: 'Amazon S3',
        });

        const verifyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Verify Credential' }));
        await verifyButton.click();

        expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.credentials.verify', [{
          provider: 'S3',
          attributes: {
            s3attribute: 's3 value',
          },
        }]);
      });

      it('calls beforeSubmit before verifying entered values', async () => {
        await form.fillForm({
          Name: 'New sync',
          Provider: 'Amazon S3',
        });

        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Verify Credential' }));
        await saveButton.click();

        const providerForm = spectator.query(S3ProviderFormComponent);
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
          Name: 'New sync',
          Provider: 'Amazon S3',
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

    describe('saving', () => {
      it('calls beforeSubmit before saving form', async () => {
        await form.fillForm({
          Name: 'New sync',
          Provider: 'Amazon S3',
        });

        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        await saveButton.click();

        const providerForm = spectator.query(S3ProviderFormComponent);
        expect(providerForm.beforeSubmit).toHaveBeenCalled();
      });

      it('saves new credentials when new form is saved', async () => {
        await form.fillForm({
          Name: 'New sync',
          Provider: 'Amazon S3',
        });

        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        await saveButton.click();

        expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.credentials.create', [{
          name: 'New sync',
          provider: CloudsyncProviderName.AmazonS3,
          attributes: {
            s3attribute: 's3 value',
          },
        }]);
        expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalledWith(true);
        expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      });

      it('sets default name when provider is selected and name field has not been touched by the user', async () => {
        await form.fillForm({
          Provider: 'Amazon S3',
        });
        expect(await form.getValues()).toMatchObject({
          Name: 'Amazon S3',
        });

        await form.fillForm({
          Provider: 'Box',
        });
        expect(await form.getValues()).toMatchObject({
          Name: 'Box',
        });

        await form.fillForm({
          Name: 'My Box',
        });
        await form.fillForm({
          Provider: 'Amazon S3',
        });

        expect(await form.getValues()).toEqual({
          Name: 'My Box',
          Provider: 'Amazon S3',
        });
      });
    });
  });

  describe('saving with credentials', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [{ provide: SLIDE_IN_DATA, useValue: fakeCloudsyncCredential }],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows existing values when form is opened for edit', async () => {
      spectator.component.setCredentialsForEdit();
      const commonFormValues = await form.getValues();
      expect(commonFormValues).toEqual({
        Name: 'My backup server',
        Provider: 'Amazon S3',
      });

      const providerForm = spectator.query(S3ProviderFormComponent);
      expect(providerForm).toBeTruthy();
      expect(providerForm.getFormSetter$().next).toHaveBeenCalledWith({
        hostname: 'backup.com',
      });
    });

    it('updates existing credentials when edit form is saved', async () => {
      spectator.component.setCredentialsForEdit();

      await form.fillForm({
        Name: 'My updated server',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.credentials.update', [
        233,
        {
          name: 'My updated server',
          provider: CloudsyncProviderName.AmazonS3,
          attributes: {
            s3attribute: 's3 value',
          },
        },
      ]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
