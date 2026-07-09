import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnSelectHarness, TnStepperComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CloudCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';
import { StorjProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { CloudSyncProviderDescriptionComponent } from 'app/pages/data-protection/cloudsync/cloudsync-provider-description/cloudsync-provider-description.component';
import { storjProvider, googlePhotosProvider, googlePhotosCreds } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import { CloudSyncProviderComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DatasetService } from 'app/services/dataset/dataset.service';

describe('CloudSyncProviderComponent', () => {
  let spectator: Spectator<CloudSyncProviderComponent>;
  let loader: HarnessLoader;
  const slideInRef = {
    next: jest.fn(),
    swap: jest.fn(),
    getData: jest.fn(),
    requireConfirmationWhen: jest.fn(),
  };

  const loading = {
    emit: jest.fn(),
  };
  const save = {
    emit: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: CloudSyncProviderComponent,
    imports: [
      ReactiveFormsModule,
      CloudSyncProviderDescriptionComponent,
      CloudCredentialsSelectComponent,
      GooglePhotosProviderFormComponent,
      StorjProviderFormComponent,
    ],
    providers: [
      mockProvider(TnStepperComponent),
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('cloudsync.providers', [storjProvider, googlePhotosProvider]),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
        mockCall('cloudsync.credentials.verify', {
          valid: true,
        }),
      ]),
      mockProvider(CloudCredentialService, {
        getCloudSyncCredentials: jest.fn(() => of([googlePhotosCreds])),
        getProviders: jest.fn(() => of([storjProvider, googlePhotosProvider])),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(DatasetService),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
    ],
  });

  // Created per-test (not in a shared beforeEach) so individual tests can override the credentials
  // mock — overrideProvider must run before TestBed is instantiated.
  function setup(getCloudSyncCredentials: jest.Mock = jest.fn(() => of([googlePhotosCreds]))): void {
    spectator = createComponent({
      providers: [
        mockProvider(CloudCredentialService, {
          getCloudSyncCredentials,
          getProviders: jest.fn(() => of([storjProvider, googlePhotosProvider])),
        }),
      ],
    });
    Object.defineProperty(spectator.component, 'loading', {
      value: loading,
    });
    Object.defineProperty(spectator.component, 'save', {
      value: save,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('emits the value of credentials when credentials value changes', async () => {
    setup();
    await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="exist_credential"]' })))
      .selectOption('Google Photos (Google Photos)');

    const verifyButton = await loader.getHarness(TnButtonHarness.with({ label: 'Verify Credential' }));
    await verifyButton.click();

    expect(save.emit).toHaveBeenNthCalledWith(1, googlePhotosCreds);
  });

  it('verifies entered values when user presses Verify', async () => {
    setup();
    await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="exist_credential"]' })))
      .selectOption('Google Photos (Google Photos)');

    const verifyButton = await loader.getHarness(TnButtonHarness.with({ label: 'Verify Credential' }));
    await verifyButton.click();

    expect(loading.emit).toHaveBeenNthCalledWith(1, true);
    expect(loading.emit).toHaveBeenNthCalledWith(2, false);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.credentials.verify', [{
      type: 'GOOGLE_PHOTOS',
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      token: 'test-token',
    }]);
  });

  it('re-fetches and emits the credential when the chosen one is not cached yet', async () => {
    // Reproduces the dashboard race: this step's own credentials query is still cold when the user
    // picks an option (the select loads its options independently), so the first lookup misses.
    setup(
      jest.fn()
        .mockReturnValueOnce(of([])) // cold cache when the step initializes
        .mockReturnValue(of([googlePhotosCreds])), // populated by the time it re-fetches
    );

    await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="exist_credential"]' })))
      .selectOption('Google Photos (Google Photos)');

    expect(save.emit).toHaveBeenCalledWith(googlePhotosCreds);
  });

  it('does nothing on Verify when no credential is selected', () => {
    setup();
    spectator.component.onVerify();

    expect(loading.emit).not.toHaveBeenCalled();
    expect(spectator.inject(ApiService).call)
      .not.toHaveBeenCalledWith('cloudsync.credentials.verify', expect.anything());
  });
});
