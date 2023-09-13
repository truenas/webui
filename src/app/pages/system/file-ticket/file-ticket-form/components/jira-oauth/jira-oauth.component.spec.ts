import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { OauthJiraMessage } from 'app/interfaces/support.interface';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { OauthButtonModule } from 'app/modules/oauth-button/oauth-button.module';
import { JiraOauthComponent } from 'app/pages/system/file-ticket/file-ticket-form/components/jira-oauth/jira-oauth.component';

describe('JiraOauthComponent', () => {
  let spectator: Spectator<JiraOauthComponent>;
  let loader: HarnessLoader;
  let formControl: FormControl<unknown>;

  const createHost = createHostFactory({
    component: JiraOauthComponent,
    imports: [
      ReactiveFormsModule,
      OauthButtonModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
    ],
    providers: [
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: null },
      mockWindow({
        location: {
          toString: () => 'http://localhost',
        },
        open: jest.fn() as Window['open'],
        addEventListener: jest.fn((_, oAuthCallback: (message: OauthJiraMessage) => void) => {
          oAuthCallback({
            data: 'token-arrived',
          } as unknown as OauthJiraMessage);
        }) as Window['addEventListener'],
        removeEventListener: jest.fn() as Window['removeEventListener'],
      }),
    ],
  });

  beforeEach(() => {
    formControl = new FormControl('');
    spectator = createHost(
      '<ix-jira-oauth [formControl]="formControl"></ix-jira-oauth>', {
        hostProps: { formControl },
      },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens a modal with authentication flow when Log In To Provider is pressed', async () => {
    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Jira' }));
    await loginButton.click();

    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith(
      'https://support-proxy.ixsystems.com/oauth/initiate?origin=http%3A%2F%2Flocalhost',
      '_blank',
      'width=640,height=480',
    );
    expect(spectator.inject<Window>(WINDOW).addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
      false,
    );
  });

  it('calls removeEventListener when oAuth callback is called', async () => {
    const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Jira' }));
    await loginButton.click();

    expect(spectator.inject<Window>(WINDOW).removeEventListener)
      .toHaveBeenCalledWith('message', expect.any(Function), false);
  });
});
