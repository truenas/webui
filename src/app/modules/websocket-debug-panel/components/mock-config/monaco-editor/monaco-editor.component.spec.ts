/* eslint-disable @typescript-eslint/dot-notation */
import { FormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MonacoEditorComponent } from './monaco-editor.component';

describe('MonacoEditorComponent', () => {
  let spectator: Spectator<MonacoEditorComponent>;

  const createComponent = createComponentFactory({
    component: MonacoEditorComponent,
    imports: [FormsModule],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('input properties', () => {
    it('should have default values', () => {
      expect(spectator.component.value()).toBeNull();
      expect(spectator.component.language()).toBe('json');
      expect(spectator.component.height()).toBe(200);
    });

    it('should accept custom values', () => {
      spectator.setInput('value', { test: 'data' });
      spectator.setInput('language', 'javascript');
      spectator.setInput('height', 300);

      expect(spectator.component.value()).toEqual({ test: 'data' });
      expect(spectator.component.language()).toBe('javascript');
      expect(spectator.component.height()).toBe(300);
    });
  });

  describe('value display', () => {
    it('should display empty string for null/undefined', () => {
      spectator.setInput('value', null);
      spectator.component.ngOnInit();
      expect(spectator.component['displayValue']).toBe('');

      spectator.setInput('value', undefined);
      spectator.component.ngOnChanges();
      expect(spectator.component['displayValue']).toBe('');
    });

    it('should display string values directly', () => {
      spectator.setInput('value', 'plain text');
      spectator.component.ngOnInit();
      expect(spectator.component['displayValue']).toBe('plain text');
    });

    it('should stringify object values', () => {
      const testObject = { foo: 'bar', nested: { value: 42 } };
      spectator.setInput('value', testObject);
      spectator.component.ngOnInit();

      expect(spectator.component['displayValue']).toBe(JSON.stringify(testObject, null, 2));
    });

    it('should handle non-stringifiable values', () => {
      // Create circular reference
      const circular = { a: 1, self: null as unknown };
      circular.self = circular;

      spectator.setInput('value', circular);
      spectator.component.ngOnInit();

      expect(spectator.component['displayValue']).toBe('[object Object]');
    });

    it('should update display value on changes', () => {
      spectator.setInput('value', { initial: true });
      spectator.component.ngOnInit();

      const initialDisplay = spectator.component['displayValue'];

      spectator.setInput('value', { updated: true });
      spectator.component.ngOnChanges();

      expect(spectator.component['displayValue']).not.toBe(initialDisplay);
      expect(spectator.component['displayValue']).toContain('"updated": true');
    });
  });

  describe('value changes', () => {
    it('should emit parsed JSON when valid', () => {
      const valueChangeSpy = jest.spyOn(spectator.component.valueChange, 'emit');

      const event = {
        target: {
          value: '{"test": "data", "number": 123}',
        },
      } as unknown as Event;

      spectator.component['onValueChange'](event);

      expect(valueChangeSpy).toHaveBeenCalledWith({
        test: 'data',
        number: 123,
      });
    });

    it('should emit string when JSON is invalid', () => {
      const valueChangeSpy = jest.spyOn(spectator.component.valueChange, 'emit');

      const event = {
        target: {
          value: 'not valid json {',
        },
      } as unknown as Event;

      spectator.component['onValueChange'](event);

      expect(valueChangeSpy).toHaveBeenCalledWith('not valid json {');
    });

    it('should emit null for empty or whitespace-only input', () => {
      const valueChangeSpy = jest.spyOn(spectator.component.valueChange, 'emit');

      const emptyEvent = {
        target: { value: '' },
      } as unknown as Event;

      spectator.component['onValueChange'](emptyEvent);
      expect(valueChangeSpy).toHaveBeenCalledWith(null);

      const whitespaceEvent = {
        target: { value: '   \n  \t  ' },
      } as unknown as Event;

      spectator.component['onValueChange'](whitespaceEvent);
      expect(valueChangeSpy).toHaveBeenCalledWith(null);
    });

    it('should handle arrays and other valid JSON types', () => {
      const valueChangeSpy = jest.spyOn(spectator.component.valueChange, 'emit');

      const arrayEvent = {
        target: { value: '[1, 2, 3]' },
      } as unknown as Event;

      spectator.component['onValueChange'](arrayEvent);
      expect(valueChangeSpy).toHaveBeenCalledWith([1, 2, 3]);

      const booleanEvent = {
        target: { value: 'true' },
      } as unknown as Event;

      spectator.component['onValueChange'](booleanEvent);
      expect(valueChangeSpy).toHaveBeenCalledWith(true);

      const numberEvent = {
        target: { value: '42.5' },
      } as unknown as Event;

      spectator.component['onValueChange'](numberEvent);
      expect(valueChangeSpy).toHaveBeenCalledWith(42.5);
    });
  });

  describe('textarea integration', () => {
    it('should bind displayValue to textarea', () => {
      const testValue = { bound: 'value' };
      spectator.setInput('value', testValue);
      spectator.component.ngOnInit();
      spectator.detectChanges();

      const textarea = spectator.query('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe(spectator.component['displayValue']);
    });

    it('should trigger onValueChange when textarea changes', () => {
      const onValueChangeSpy = jest.spyOn(spectator.component, 'onValueChange' as never);
      spectator.detectChanges();

      const textarea = spectator.query('textarea') as HTMLTextAreaElement;
      textarea.value = '{"new": "value"}';
      textarea.dispatchEvent(new Event('input'));

      expect(onValueChangeSpy).toHaveBeenCalled();
    });
  });
});
