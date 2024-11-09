import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { helptextAbout } from 'app/helptext/about';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetHelpComponent } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.component';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('WidgetHelpComponent', () => {
  let spectator: Spectator<WidgetHelpComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<AppState>;

  const createComponent = createComponentFactory({
    component: WidgetHelpComponent,
    declarations: [
      MockComponent(CopyrightLineComponent),
    ],
    providers: [
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: false,
        }],
      }),
    ],
  });

  function setupTest(size: SlotSize): void {
    spectator = createComponent({ props: { size } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  }

  describe('full size widget', () => {
    beforeEach(() => {
      setupTest(SlotSize.Full);
    });

    it('renders widget title', () => {
      expect(spectator.query('.header')).toHaveText('TrueNAS Help');
    });

    it('checks help lines', async () => {
      const icons = await loader.getAllHarnesses(IxIconHarness);
      const [firstIcon, secondIcon, thirdIcon] = await parallel(() => icons.map((icon) => icon.getName()));
      const [firstLine, secondLine, thirdLine] = spectator.queryAll('.helptext');
      const [firstHrefIconLine, secondHrefIconLine, thirdHrefIconLine] = spectator.queryAll('.icon-wrapper');

      expect(spectator.query('.icon-wrapper a ix-icon')).toExist();

      expect(firstIcon).toBe('assignment');
      expect(firstLine.innerHTML).toBe(helptextAbout.docs);
      expect(firstHrefIconLine.textContent).not.toExist();

      expect(secondIcon).toBe('group');
      expect(secondLine.innerHTML).toBe(helptextAbout.forums);
      expect(secondHrefIconLine.textContent).not.toExist();

      expect(thirdIcon).toBe('mail');
      expect(thirdLine.innerHTML).toBe(helptextAbout.newsletter);
      expect(thirdHrefIconLine.textContent).not.toExist();
    });

    it('renders copyright', () => {
      expect(spectator.query(CopyrightLineComponent)).toExist();
    });
  });

  describe('half size widget', () => {
    beforeEach(() => {
      setupTest(SlotSize.Half);
    });

    it('renders widget title', () => {
      expect(spectator.query('.header')).toHaveText('TrueNAS Help');
    });

    it('checks help lines', async () => {
      const icons = await loader.getAllHarnesses(IxIconHarness);
      const [firstIcon, secondIcon, thirdIcon] = await parallel(() => icons.map((icon) => icon.getName()));
      const [firstLine, secondLine, thirdLine] = spectator.queryAll('.helptext');
      const [firstHrefIconLine, secondHrefIconLine, thirdHrefIconLine] = spectator.queryAll('.icon-wrapper');

      expect(spectator.query('.icon-wrapper a ix-icon')).toExist();

      expect(firstIcon).toBe('assignment');
      expect(firstLine.innerHTML).toBe(helptextAbout.docs);
      expect(firstHrefIconLine.textContent).toBe('Docs');

      expect(secondIcon).toBe('group');
      expect(secondLine.innerHTML).toBe(helptextAbout.forums);
      expect(secondHrefIconLine.textContent).toBe('Forums');

      expect(thirdIcon).toBe('mail');
      expect(thirdLine.innerHTML).toBe(helptextAbout.newsletter);
      expect(thirdHrefIconLine.textContent).toBe('Newsletter');
    });

    it('renders copyright', () => {
      expect(spectator.query(CopyrightLineComponent)).toExist();
    });
  });

  describe('quarter size widget', () => {
    beforeEach(() => {
      setupTest(SlotSize.Quarter);
    });

    it('renders widget title', () => {
      expect(spectator.query('.header')).toHaveText('TrueNAS Help');
    });

    it('checks help lines', async () => {
      const icons = await loader.getAllHarnesses(IxIconHarness);
      const [firstIcon, secondIcon, thirdIcon] = await parallel(() => icons.map((icon) => icon.getName()));
      const [firstLine, secondLine, thirdLine] = spectator.queryAll('.helptext');
      const [firstHrefIconLine, secondHrefIconLine, thirdHrefIconLine] = spectator.queryAll('.icon-wrapper');

      expect(spectator.query('.icon-wrapper a ix-icon')).toExist();

      expect(firstIcon).toBe('assignment');
      expect(firstLine.innerHTML).toBe(helptextAbout.docs);
      expect(firstHrefIconLine.textContent).toBe('Docs');

      expect(secondIcon).toBe('group');
      expect(secondLine.innerHTML).toBe(helptextAbout.forums);
      expect(secondHrefIconLine.textContent).toBe('Forums');

      expect(thirdIcon).toBe('mail');
      expect(thirdLine.innerHTML).toBe(helptextAbout.newsletter);
      expect(thirdHrefIconLine.textContent).toBe('Newsletter');
    });

    it('checks open source row', () => {
      expect(spectator.query('.open-source')).toHaveText('TrueNAS is Free');

      store$.overrideSelector(selectIsEnterprise, true);
      store$.refreshState();
      spectator.detectChanges();

      expect(spectator.query('.open-source')).not.toExist();
    });

    it('renders copyright', () => {
      expect(spectator.query(CopyrightLineComponent)).toExist();
    });
  });
});
