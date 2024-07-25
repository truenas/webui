import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';

describe('WidgetDatapointComponent', () => {
  let spectator: Spectator<WidgetDatapointComponent>;

  const label = 'Test label';
  const text = 'Test text';
  const subText = 'Test sub text';

  const createComponent = createComponentFactory({
    component: WidgetDatapointComponent,
  });

  function setupTest(props: {
    size: SlotSize;
    label: string;
    text: string;
    subText?: string;
  }): void {
    spectator = createComponent({ props });
  }

  describe('when size is full', () => {
    beforeEach(() => {
      setupTest({
        size: SlotSize.Full, label, text, subText,
      });
    });

    it(`it has label '${label}'`, () => {
      expect(spectator.query('.header')).toContainText(label);
    });

    it(`it has text '${text}'`, () => {
      expect(spectator.component.maxFontSize).toBe(49);
      expect(spectator.query('.container')).toContainText(text);
    });

    it(`it has sub text '${subText}'`, () => {
      expect(spectator.query('.container .sub-text')).toHaveText(subText);
    });
  });

  describe('when size is half', () => {
    beforeEach(() => {
      setupTest({
        size: SlotSize.Half, label, text, subText,
      });
    });

    it(`it has label '${label}'`, () => {
      expect(spectator.query('.header')).toContainText(label);
    });

    it(`it has text '${text}'`, () => {
      expect(spectator.component.maxFontSize).toBe(49);
      expect(spectator.query('.container')).toContainText(text);
    });

    it(`it has sub text '${subText}'`, () => {
      expect(spectator.query('.container .sub-text')).toHaveText(subText);
    });
  });

  describe('when size is quarter', () => {
    it('checks when no subtext', () => {
      setupTest({
        size: SlotSize.Quarter, label, text,
      });

      expect(spectator.query('.header')).toContainText(label);
      expect(spectator.component.maxFontSize).toBe(30);
      expect(spectator.query('.container')).toContainText(text);
      expect(spectator.query('.container .sub-text')).not.toExist();
    });

    it('checks when has subtext', () => {
      setupTest({
        size: SlotSize.Quarter, label, text, subText,
      });

      expect(spectator.query('.header')).toContainText(label);
      expect(spectator.component.maxFontSize).toBe(30);
      expect(spectator.query('.container')).toContainText(text);
      expect(spectator.query('.container .sub-text')).toHaveText(subText);
    });

    it('checks when has title is empty', () => {
      setupTest({
        size: SlotSize.Quarter, label: ' ', text, subText,
      });

      expect(spectator.query('.header')).toContainText('');
      expect(spectator.component.maxFontSize).toBe(30);
      expect(spectator.query('.container')).toContainText(text);
      expect(spectator.query('.container .sub-text')).toHaveText(subText);
    });

    it('checks font size when text has maximum lenght', () => {
      const longText = 'a'.repeat(130);
      setupTest({
        size: SlotSize.Quarter, label, text: longText, subText,
      });

      expect(spectator.query('.header')).toHaveText(label);
      expect(spectator.component.maxFontSize).toBe(15);
      expect(spectator.query('.container')).toContainText(longText);
      expect(spectator.query('.container .sub-text')).toHaveText(subText);
    });
  });
});
