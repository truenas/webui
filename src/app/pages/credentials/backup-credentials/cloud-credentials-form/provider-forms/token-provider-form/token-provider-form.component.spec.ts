import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  TokenProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/token-provider-form/token-provider-form.component';

describe('TokenProviderFormComponent', () => {
  let spectator: Spectator<TokenProviderFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TokenProviderFormComponent,
    detectChanges: false,
    imports: [
      ReactiveFormsModule,
      OauthProviderComponent,
    ],
    providers: [
      mockProvider(DialogService),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.provider = {} as CloudSyncProvider;
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('without credentials_oauth set provider', () => {
    it('show existing provider attributes when they are set as form values', async () => {
      spectator.component.getFormSetter$().next({
        token: 'token1234',
      });

      expect(await (await getInput('token')).getValue()).toBe('token1234');
    });

    it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
      await (await getInput('token')).setValue('newtoken1234');

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
      } as CloudSyncProvider;
      spectator.detectComponentChanges();
    });

    it('show existing provider attributes when they are set as form values', async () => {
      spectator.component.getFormSetter$().next({
        token: 'token1234',
      });

      expect(await (await getInput('token')).getValue()).toBe('token1234');
    });

    it('returns form attributes for submission when getSubmitAttributes() is called', async () => {
      await (await getInput('token')).setValue('newtoken1234');

      const values = spectator.component.getSubmitAttributes();
      expect(values).toEqual({
        client_id: '',
        client_secret: '',
        token: 'newtoken1234',
      });
    });
  });
});
