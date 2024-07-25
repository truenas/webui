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
    subText: string;
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
    beforeEach(() => {
      setupTest({
        size: SlotSize.Quarter, label, text, subText,
      });
    });

    it(`it has label '${label}'`, () => {
      expect(spectator.query('.header')).toContainText(label);
    });

    it(`it has text '${text}'`, () => {
      expect(spectator.component.maxFontSize).toBe(30);
      expect(spectator.query('.container')).toContainText(text);
    });

    it(`it has sub text '${subText}'`, () => {
      expect(spectator.query('.container .sub-text')).toHaveText(subText);
    });
  });
});
