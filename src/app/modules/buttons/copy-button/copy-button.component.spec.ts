import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness, TnMenuHarness } from '@truenas/ui-components';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

describe('CopyButtonComponent', () => {
  let spectator: Spectator<CopyButtonComponent>;
  let loader: HarnessLoader;

  const writeText = jest.fn(() => Promise.resolve());

  const createComponent = createComponentFactory({
    component: CopyButtonComponent,
    providers: [
      mockProvider(SnackbarService),
    ],
  });

  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterAll(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });

  beforeEach(() => {
    writeText.mockClear();
  });

  describe('plain text', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { text: 'some text' } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('copies the text to the clipboard when the button is pressed', async () => {
      const button = await loader.getHarness(TnIconButtonHarness);
      await button.click();

      expect(writeText).toHaveBeenCalledWith('some text');
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Copied to clipboard');
    });

    // writeText rejects when the document isn't focused or the permission is denied.
    it('shows an error when the clipboard write is rejected', async () => {
      writeText.mockRejectedValueOnce(new Error('Document is not focused'));

      const button = await loader.getHarness(TnIconButtonHarness);
      await button.click();

      expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith('Failed to copy to clipboard');
      expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    });
  });

  describe('json', () => {
    async function openMenu(): Promise<TnMenuHarness> {
      const trigger = await loader.getHarness(TnIconButtonHarness);
      await trigger.click();

      return TestbedHarnessEnvironment.documentRootLoader(spectator.fixture).getHarness(TnMenuHarness);
    }

    beforeEach(() => {
      spectator = createComponent({
        props: {
          text: 'some text',
          jsonText: { key: 'value' },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('offers both a text and a json option', async () => {
      const menu = await openMenu();

      expect(await menu.getItemLabels()).toEqual(['Copy Text', 'Copy Json']);
    });

    // The menu-item test ids are the ones the old `<button mat-menu-item ixTest="copy-text">`
    // resolved to. The prefix is now composed by the library, so pin the resolved values.
    // This asserts the Release Engineering contract, so reading `data-test` is the point of
    // the test. TnMenuHarness has no per-item harness to read it from (library gap 7 in
    // TRUENAS_UI_INTEGRATION.md), so the items are located in this fixture's own overlay
    // container rather than the whole document. Drop the query for the harness's own
    // `getTestId()` once the library exposes a per-item harness.
    it('keeps the legacy test ids on the menu items', async () => {
      await openMenu();

      const overlay = spectator.inject(OverlayContainer).getContainerElement();
      const items = Array.from(overlay.querySelectorAll('.tn-menu-item'));

      expect(items.map((item) => item.getAttribute('data-test')))
        .toEqual(['button-copy-text', 'button-copy-json-text']);
    });

    it('copies the plain text when Copy Text is selected', async () => {
      const menu = await openMenu();
      await menu.clickItem({ label: 'Copy Text' });

      expect(writeText).toHaveBeenCalledWith('some text');
    });

    it('copies formatted json when Copy Json is selected', async () => {
      const menu = await openMenu();
      await menu.clickItem({ label: 'Copy Json' });

      expect(writeText).toHaveBeenCalledWith(JSON.stringify({ key: 'value' }, null, 2));
    });
  });
});
