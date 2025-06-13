import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { terminalFontSizeUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { TerminalFontSizeComponent } from './terminal-font-size.component';

describe('TerminalFontSizeComponent', () => {
  let spectator: Spectator<TerminalFontSizeComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TerminalFontSizeComponent,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: { ...defaultPreferences, terminalFontSize: 16 },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.inject(Store), 'dispatch');
    jest.spyOn(spectator.component.fontSizeChanged, 'emit');
  });

  it('emits value from the store on init', () => {
    spectator.component.ngOnInit();
    expect(spectator.component.fontSizeChanged.emit).toHaveBeenCalledWith(16);
  });

  it('emits and stores value when font size increases', async () => {
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'add' }));
    await icon.click();
    expect(spectator.component.fontSizeChanged.emit).toHaveBeenCalledWith(17);
    expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(terminalFontSizeUpdated({ fontSize: 17 }));
  });

  it('does not let font size to exceed max value', async () => {
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'add' }));
    for (let i = 0; i < 25 - 16 + 1; i++) {
      await icon.click();
    }

    expect(spectator.component.fontSizeChanged.emit).toHaveBeenLastCalledWith(25);
    expect(spectator.inject(Store).dispatch).toHaveBeenLastCalledWith(terminalFontSizeUpdated({ fontSize: 25 }));
  });

  it('does not go below min font size', async () => {
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'remove' }));
    for (let i = 0; i < 16 - 10 + 1; i++) {
      await icon.click();
    }

    expect(spectator.component.fontSizeChanged.emit).toHaveBeenLastCalledWith(10);
    expect(spectator.inject(Store).dispatch).toHaveBeenLastCalledWith(terminalFontSizeUpdated({ fontSize: 10 }));
  });
});
