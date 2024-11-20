import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { OauthButtonType } from 'app/modules/buttons/oauth-button/interfaces/oauth-button.interface';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';

describe('OauthButtonComponent', () => {
  let spectator: Spectator<OauthButtonComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: OauthButtonComponent,
    imports: [],
    providers: [
      mockWindow({
        open: jest.fn(),
        location: {
          toString: () => 'http://current-url.com/auth',
        } as Location,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Login In To Gmail Button', async () => {
    spectator.setInput('oauthType', OauthButtonType.Gmail);
    spectator.setInput('oauthUrl', 'https://oauth/gmail?origin=');

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
    expect(await button.getText()).toBe('Log In To Gmail');

    await button.click();
    const window = spectator.inject<Window>(WINDOW);
    expect(window.open).toHaveBeenCalledWith(
      `https://oauth/gmail?origin=${encodeURIComponent('http://current-url.com/auth')}`,
      '_blank',
      'width=640,height=480',
    );

    spectator.setInput('isLoggedIn', true);
    expect(await button.getText()).toBe('Logged In To Gmail');
  });

  it('shows Login In To Jira Button', async () => {
    spectator.setInput('oauthType', OauthButtonType.Jira);
    spectator.setInput('oauthUrl', 'https://oauth/jira?origin=');

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Login To Jira To Submit' }));
    expect(await button.getText()).toBe('Login To Jira To Submit');

    await button.click();
    const window = spectator.inject<Window>(WINDOW);
    expect(window.open).toHaveBeenCalledWith(
      `https://oauth/jira?origin=${encodeURIComponent('http://current-url.com/auth')}`,
      '_blank',
      'width=640,height=480',
    );

    spectator.setInput('isLoggedIn', true);
    expect(await button.getText()).toBe('Logged In To Jira');
  });

  it('shows Login In To Provider Button', async () => {
    spectator.setInput('oauthType', OauthButtonType.Provider);
    spectator.setInput('oauthUrl', 'https://oauth/provider?origin=');

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Provider' }));
    expect(await button.getText()).toBe('Log In To Provider');

    await button.click();
    const window = spectator.inject<Window>(WINDOW);
    expect(window.open).toHaveBeenCalledWith(
      `https://oauth/provider?origin=${encodeURIComponent('http://current-url.com/auth')}`,
      '_blank',
      'width=640,height=480',
    );

    spectator.setInput('isLoggedIn', true);
    expect(await button.getText()).toBe('Logged In To Provider');
  });
});
