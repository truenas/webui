import { createHostFactory } from '@ngneat/spectator/jest';
import { DisableFocusableElementsDirective } from './disable-focusable-elements.directive';

describe('DisableFocusableElementsDirective', () => {
  const createDirective = createHostFactory({
    component: DisableFocusableElementsDirective,
  });

  it('should disable focusable elements when disableFocusableElements is true', () => {
    const spectator = createDirective(`
      <div *disableFocusableElements="true">
        <a href="#">Link</a>
        <button>Button</button>
        <input type="text" />
        <textarea></textarea>
        <select><option>Option</option></select>
        <div tabindex="0">Div with tabindex</div>
      </div>
    `);

    const focusableElements = spectator.queryAll('a, button, input, textarea, select, [tabindex]');

    focusableElements.forEach((el) => {
      expect(el.getAttribute('tabindex')).toBe('-1');
      expect(el.getAttribute('disabled')).toBe('true');
    });
  });

  it('should enable focusable elements when disableFocusableElements is false', () => {
    const spectator = createDirective(`
      <div *disableFocusableElements="false">
        <a href="#">Link</a>
        <button>Button</button>
        <input type="text" />
        <textarea></textarea>
        <select><option>Option</option></select>
        <div tabindex="0">Div with tabindex</div>
      </div>
    `);

    const focusableElements = spectator.queryAll('a, button, input, textarea, select, [tabindex]');
    focusableElements.forEach((el) => {
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('disabled')).toBeNull();
    });
  });
});
