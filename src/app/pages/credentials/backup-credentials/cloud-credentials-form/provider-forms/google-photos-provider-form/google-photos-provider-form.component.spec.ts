import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';

describe('GooglePhotosProviderFormComponent', () => {
  let spectator: Spectator<GooglePhotosProviderFormComponent>;
  let loader: HarnessLoader;
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('show existing provider attributes when they are set as form values', async () => {
    spectator.component.getFormSetter$().next({
      client_id: 'client1234',
      client_secret: 'secret1234',
      token: 'token1234',
    });

    expect(await (await getInput('client_id')).getValue()).toBe('client1234');
    expect(await (await getInput('client_secret')).getValue()).toBe('secret1234');
    expect(await (await getInput('token')).getValue()).toBe('token1234');
  });

  it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
    await (await getInput('token')).setValue('newtoken');
    await (await getInput('client_id')).setValue('newclient');
    await (await getInput('client_secret')).setValue('newsecret');

    const values = spectator.component.getSubmitAttributes();
    expect(values).toEqual({
      client_id: 'newclient',
      client_secret: 'newsecret',
      token: 'newtoken',
    });
  });
});
