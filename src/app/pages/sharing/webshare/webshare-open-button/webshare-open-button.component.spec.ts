import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnIconButtonHarness, TnMenuHarness } from '@truenas/ui-components';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { WebShareOpenButtonComponent } from 'app/pages/sharing/webshare/webshare-open-button/webshare-open-button.component';
import { WebShareHostnameChoice, WebShareService } from 'app/pages/sharing/webshare/webshare.service';

describe('WebShareOpenButtonComponent', () => {
  let spectator: Spectator<WebShareOpenButtonComponent>;
  let loader: HarnessLoader;
  const hostnameChoices = signal<WebShareHostnameChoice[]>([]);
  const unavailableReason = signal<TranslatedString | null>(null);

  const createComponent = createComponentFactory({
    component: WebShareOpenButtonComponent,
    providers: [
      mockProvider(WebShareService, {
        hostnameChoices,
        webShareUnavailableReason: unavailableReason,
        openWebShare: jest.fn(),
      }),
    ],
  });

  function setup(props: { shareName?: string; variant?: 'button' | 'icon' } = {}): void {
    spectator = createComponent({ props: { testId: 'webshare-open', ...props } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  beforeEach(() => {
    hostnameChoices.set([]);
    unavailableReason.set(null);
  });

  it('opens WebShare directly when there is nothing to choose from', async () => {
    setup();

    await (await loader.getHarness(TnButtonHarness.with({ label: 'Open WebShare' }))).click();

    expect(spectator.inject(WebShareService).openWebShare).toHaveBeenCalledWith(undefined, undefined);
  });

  it('is disabled when WebShare cannot be opened', async () => {
    unavailableReason.set('WebShare is unavailable because TrueNAS Connect is disabled.' as TranslatedString);
    setup();

    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Open WebShare' }));
    expect(await button.isDisabled()).toBe(true);
  });

  it('lists each IP and opens the chosen hostname when the connection has no hostname of its own', async () => {
    hostnameChoices.set([
      { ip: '10.0.0.5', hostname: '10-0-0-5.abc.truenas.direct' },
      { ip: '192.168.0.125', hostname: '192-168-0-125.abc.truenas.direct' },
    ]);
    setup({ shareName: 'documents' });

    await (await loader.getHarness(TnButtonHarness.with({ label: 'Open WebShare' }))).click();
    const menu = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture).getHarness(TnMenuHarness);

    expect(await menu.getItemLabels()).toEqual(['10.0.0.5', '192.168.0.125']);

    await menu.clickItem({ label: '192.168.0.125' });

    expect(spectator.inject(WebShareService).openWebShare)
      .toHaveBeenCalledWith('documents', '192-168-0-125.abc.truenas.direct');
  });

  it('stays disabled instead of offering the IP menu when WebShare cannot be opened', async () => {
    hostnameChoices.set([{ ip: '192.168.0.125', hostname: '192-168-0-125.abc.truenas.direct' }]);
    unavailableReason.set('WebShare is unavailable because the WebShare service is not running.' as TranslatedString);
    setup({ variant: 'icon' });

    const button = await loader.getHarness(TnIconButtonHarness.with({ name: 'open-in-new' }));
    expect(await button.isDisabled()).toBe(true);
  });

  it('renders as an icon button in the icon variant', async () => {
    setup({ variant: 'icon', shareName: 'media' });

    await (await loader.getHarness(TnIconButtonHarness.with({ name: 'open-in-new' }))).click();

    expect(spectator.inject(WebShareService).openWebShare).toHaveBeenCalledWith('media', undefined);
  });
});
