import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';

describe('GooglePhotosProviderFormComponent', () => {
  let spectator: Spectator<GooglePhotosProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: GooglePhotosProviderFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [],
    providers: [
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      client_id: 'client1234',
      client_secret: 'secret1234',
      token: 'token1234',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      Token: 'token1234',
      'OAuth Client ID': 'client1234',
      'OAuth Client Secret': 'secret1234',
    });
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await form.fillForm({
      Token: 'newtoken',
      'OAuth Client ID': 'newclient',
      'OAuth Client Secret': 'newsecret',
    });

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: 'newclient',
      client_secret: 'newsecret',
      token: 'newtoken',
    });
  });
});
