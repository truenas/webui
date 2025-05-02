import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { ProductType } from 'app/enums/product-type.enum';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetHelpComponent } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.component';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

describe('WidgetHelpComponent', () => {
  let spectator: Spectator<WidgetHelpComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: WidgetHelpComponent,
    declarations: [
      MockComponent(CopyrightLineComponent),
    ],
    providers: [
      provideMockStore({
        selectors: [{
          selector: selectProductType,
          value: ProductType.CommunityEdition,
        }],
      }),
    ],
  });

  function setupTest(size: SlotSize): void {
    spectator = createComponent({ props: { size } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
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
      const docsParsed = parseAnchorLine(firstLine.innerHTML);
      testDocs(docsParsed);

      expect(firstHrefIconLine.textContent).not.toExist();

      expect(secondIcon).toBe('group');
      const forumsParsed = parseAnchorLine(secondLine.innerHTML);
      testForums(forumsParsed);
      expect(secondHrefIconLine.textContent).not.toExist();

      expect(thirdIcon).toBe('mail');
      const newsLetterParsed = parseAnchorLine(thirdLine.innerHTML);
      testNewsLetter(newsLetterParsed);

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
      const docsParsed = parseAnchorLine(firstLine.innerHTML);
      testDocs(docsParsed);
      expect(firstHrefIconLine.textContent).toBe('Docs');

      expect(secondIcon).toBe('group');
      const forumsParsed = parseAnchorLine(secondLine.innerHTML);
      testForums(forumsParsed);
      expect(secondHrefIconLine.textContent).toBe('Forums');

      expect(thirdIcon).toBe('mail');
      const newsLetterParsed = parseAnchorLine(thirdLine.innerHTML);
      testNewsLetter(newsLetterParsed);
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
      const parsed = parseAnchorLine(firstLine.innerHTML);
      testDocs(parsed);
      expect(firstHrefIconLine.textContent).toBe('Docs');

      expect(secondIcon).toBe('group');
      const forumsParsed = parseAnchorLine(secondLine.innerHTML);
      testForums(forumsParsed);
      expect(secondHrefIconLine.textContent).toBe('Forums');

      expect(thirdIcon).toBe('mail');
      const newsLetterParsed = parseAnchorLine(thirdLine.innerHTML);
      testNewsLetter(newsLetterParsed);
      expect(thirdHrefIconLine.textContent).toBe('Newsletter');
    });

    it('checks open source row', () => {
      expect(spectator.query('.open-source')).toHaveText('TrueNAS is Free');
    });

    it('renders copyright', () => {
      expect(spectator.query(CopyrightLineComponent)).toExist();
    });
  });

  interface ParsedAnchorLine {
    textBefore: string;
    anchorText: string;
    anchorHref: string;
    anchorTarget: string | null;
    textAfter: string;
  }

  function parseAnchorLine(html: string): ParsedAnchorLine {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    const anchor = body.querySelector('a');

    return {
      textBefore: body.childNodes[0]?.textContent ?? '',
      anchorText: anchor?.textContent?.trim() ?? '',
      anchorHref: anchor?.getAttribute('href') ?? '',
      anchorTarget: anchor?.getAttribute('target'),
      textAfter: body.childNodes[2]?.textContent ?? '',
    };
  }

  function testDocs(parsed: ParsedAnchorLine): void {
    expect(parsed.anchorHref).toBe('https://www.truenas.com/docs/');
    expect(parsed.anchorTarget).toBe('_blank');
    expect(parsed.anchorText).toBe('TrueNAS Documentation Site');
    expect(parsed.textBefore).toBe('The ');
    expect(parsed.textAfter).toBe(' is a collaborative website with helpful guides and information about your new storage system.');
  }

  function testForums(forumsParsed: ParsedAnchorLine): void {
    expect(forumsParsed.anchorTarget).toBe('_blank');
    expect(forumsParsed.anchorHref).toBe('https://forums.truenas.com/');
    expect(forumsParsed.anchorText).toBe('TrueNAS Community Forums');
    expect(forumsParsed.textBefore).toBe('The ');
    expect(forumsParsed.textAfter).toBe(' are the best place to ask questions and interact with fellow TrueNAS users.');
  }

  function testNewsLetter(newsLetterParsed: ParsedAnchorLine): void {
    expect(newsLetterParsed.anchorTarget).toBe('_blank');
    expect(newsLetterParsed.anchorHref).toBe('https://www.truenas.com/newsletter/');
    expect(newsLetterParsed.textBefore).toBe('You can join the ');
    expect(newsLetterParsed.anchorText).toBe('TrueNAS Newsletter');
    expect(newsLetterParsed.textAfter).toBe(' for monthly updates and latest developments.');
  }
});
