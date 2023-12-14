import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { FileTicketFormComponent } from 'app/modules/ix-feedback/file-ticket-form/file-ticket-form.component';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { JiraOauthComponent } from 'app/modules/ix-forms/components/jira-oauth/jira-oauth.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { OauthButtonComponent } from 'app/modules/oauth-button/components/oauth-button/oauth-button.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('FileTicketFormComponent', () => {
  let spectator: Spectator<FileTicketFormComponent>;
  let loader: HarnessLoader;

  const mockToken = JSON.stringify({
    oauth_token: 'mock.oauth.token',
    oauth_token_secret: 'mock.oauth.token.secret',
  });

  const createComponent = createComponentFactory({
    component: FileTicketFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      JiraOauthComponent,
      OauthButtonComponent,
    ],
    providers: [
      mockProvider(SystemGeneralService, {
        isEnterprise: jest.fn(() => false),
        getTokenForJira: jest.fn(() => mockToken),
        setTokenForJira: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('returns payload for new ticket when getPayload is called', async () => {
    const title = await loader.getHarness(IxInputHarness.with({ label: 'Subject' }));
    await title.setValue('Test subject');

    expect(spectator.component.getPayload()).toEqual({
      title: 'Test subject',
      token: mockToken,
    });
  });
});
