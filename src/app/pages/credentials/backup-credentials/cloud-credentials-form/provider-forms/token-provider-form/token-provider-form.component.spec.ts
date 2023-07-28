import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  TokenProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/token-provider-form/token-provider-form.component';
import { DialogService } from 'app/services/dialog.service';

describe('TokenProviderFormComponent', () => {
  let spectator: Spectator<TokenProviderFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: TokenProviderFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      OauthProviderComponent,
    ],
    providers: [
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        provider: {} as CloudsyncProvider,
      },
    });
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  describe('without credentials_oauth set provider', () => {
    it('show existing provider attributes when they are set as form values', async () => {
      spectator.component.getFormSetter$().next({
        token: 'token1234',
      });

      const values = await form.getValues();
      expect(values).toEqual({
        Token: 'token1234',
      });
    });

    it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
      await form.fillForm({
        Token: 'newtoken1234',
      });

      const values = spectator.component.getSubmitAttributes();
      expect(values).toEqual({
        token: 'newtoken1234',
      });
    });
  });

  describe('with credentials_oauth set provider', () => {
    beforeEach(() => {
      spectator.component.provider = {
        credentials_oauth: 'http://truenas.com/oauth',
      } as CloudsyncProvider;
      spectator.detectComponentChanges();
    });

    it('show existing provider attributes when they are set as form values', async () => {
      spectator.component.getFormSetter$().next({
        client_id: 'client1234',
        client_secret: 'secret1234',
        token: 'token1234',
      });

      const values = await form.getValues();
      expect(values).toEqual({
        'OAuth Client ID': 'client1234',
        'OAuth Client Secret': 'secret1234',
        Token: 'token1234',
      });
    });

    it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
      await form.fillForm({
        'OAuth Client ID': 'client1234',
        'OAuth Client Secret': 'secret1234',
        Token: 'newtoken1234',
      });

      const values = spectator.component.getSubmitAttributes();
      expect(values).toEqual({
        client_id: 'client1234',
        client_secret: 'secret1234',
        token: 'newtoken1234',
      });
    });
  });
});
