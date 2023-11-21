import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';
import { StorjProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { storjProvider, googlePhotosProvider, googlePhotosCreds } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import { CloudsyncProviderComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
    await form.fillForm({ 'Credentials': 'Create New' });

    expect(spectator.inject(CloudCredentialService).getProviders).toHaveBeenCalledWith();

    const providersSelect = await form.getControl('Provider') as IxSelectHarness;
    expect(await providersSelect.getOptionLabels()).toEqual(['Storj iX', 'Google Photos']);
  });

  it('renders dynamic provider specific form when Provider is selected', async () => {
    await form.fillForm({ 'Credentials': 'Create New' });

    const providersSelect = await form.getControl('Provider') as IxSelectHarness;
    await providersSelect.setValue('Google Photos');

    const providerForm = spectator.query(GooglePhotosProviderFormComponent);
    expect(providerForm).toBeTruthy();
    expect(providerForm.provider).toBe(googlePhotosProvider);
  });

  it('returns fields default value when getPayload() is called', async () => {
    await form.fillForm({ 'Credentials': 'Create New' });

    expect(spectator.component.getPayload()).toEqual({
      provider: CloudsyncProviderName.Storj,
      attributes: {
        access_key_id: '',
        secret_access_key: '',
      },
      name: 'Storj',
    });
  });

  it('when an existing name is entered, the "Next" button is disabled', async () => {
    await form.fillForm({ 'Credentials': 'Create New' });

    const nextButton = await loader.getHarness(MatButtonHarness.with({ text: 'Next' }));

    await form.fillForm({ 'Name': 'Google Photos - testUser' });
    expect(await nextButton.isDisabled()).not.toBeDisabled();
  });

  it('verifies entered values when user presses Verify', async () => {
    await form.fillForm({
      'Credentials': 'Google Photos (Google Photos)',
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
});
