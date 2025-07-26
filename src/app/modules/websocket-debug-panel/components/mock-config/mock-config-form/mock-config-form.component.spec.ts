/* eslint-disable @typescript-eslint/dot-notation */
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockConfig, MockEvent } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import * as WebSocketDebugActions from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { MockConfigFormComponent } from './mock-config-form.component';

// Mock crypto.randomUUID globally
if (!global.crypto) {
  global.crypto = {} as Crypto;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = jest.fn().mockImplementation(() => `test-uuid-${Math.random()}`);
}

describe('MockConfigFormComponent', () => {
  let spectator: Spectator<MockConfigFormComponent>;
  let store$: MockStore;

  const mockConfig: MockConfig = {
    id: 'test-123',
    enabled: true,
    methodName: 'test.method',
    messagePattern: 'test pattern',
    response: {
      result: { success: true },
      delay: 500,
    },
    events: [
      {
        delay: 1000,
        fields: {
          state: 'RUNNING',
          description: 'Test event',
          result: { test: 'data' },
        },
      },
    ],
  };

  const createComponent = createComponentFactory({
    component: MockConfigFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should initialize with empty form when no config provided', () => {
      expect(spectator.component['form'].value).toEqual({
        methodName: '',
        messagePattern: '',
        responseResult: '',
        responseDelay: 0,
        events: [],
      });
    });

    it('should populate form when config is provided', () => {
      spectator.setInput('config', mockConfig);
      spectator.component['ngOnInit']();

      expect(spectator.component['form'].value).toEqual({
        methodName: 'test.method',
        messagePattern: 'test pattern',
        responseResult: '{\n  "success": true\n}',
        responseDelay: 500,
        events: [
          {
            delay: 1000,
            fields: {
              state: 'RUNNING',
              description: 'Test event',
              result: { test: 'data' },
            },
          },
        ],
      });
    });

    it('should handle config without optional fields', () => {
      const minimalConfig: MockConfig = {
        id: 'test-456',
        enabled: false,
        methodName: 'minimal.method',
        response: {
          result: null,
        },
      };

      spectator.setInput('config', minimalConfig);
      spectator.component['ngOnInit']();

      expect(spectator.component['form'].value).toEqual({
        methodName: 'minimal.method',
        messagePattern: '',
        responseResult: '',
        responseDelay: 0,
        events: [],
      });
    });
  });

  describe('form submission', () => {
    it('should emit submitted event with new config when creating', () => {
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      spectator.component['form'].patchValue({
        methodName: 'new.method',
        messagePattern: 'new pattern',
        responseDelay: 1000,
      });

      spectator.component['form'].patchValue({
        responseResult: '{"newResult":true}',
        events: [],
      });

      spectator.component['onSubmit']();

      expect(submittedSpy).toHaveBeenCalledWith({
        id: expect.any(String),
        enabled: true,
        methodName: 'new.method',
        messagePattern: 'new pattern',
        response: {
          result: { newResult: true },
          delay: 1000,
        },
        events: undefined,
      });
    });

    it('should dispatch updateMockConfig when editing existing config', () => {
      spectator.setInput('config', mockConfig);
      spectator.component['ngOnInit']();

      spectator.component['form'].patchValue({
        methodName: 'updated.method',
      });

      spectator.component['onSubmit']();

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.updateMockConfig({
          config: expect.objectContaining({
            id: 'test-123',
            methodName: 'updated.method',
          }),
        }),
      );
    });

    it('should not submit when form is invalid', () => {
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      // Method name is required, so form is invalid
      spectator.component['onSubmit']();

      expect(submittedSpy).not.toHaveBeenCalled();
    });

    it('should handle events when present', () => {
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');
      const testEvents: MockEvent[] = [
        {
          delay: 100,
          fields: {
            state: 'RUNNING',
            description: 'Event 1',
            result: { data: 1 },
          },
        },
        {
          delay: 200,
          fields: {
            state: 'SUCCESS',
            description: 'Event 2',
            result: { data: 2 },
          },
        },
      ];

      spectator.component['form'].patchValue({
        methodName: 'event.method',
      });

      spectator.component['onEventsChange'](testEvents);
      spectator.component['onSubmit']();

      expect(submittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          events: testEvents,
        }),
      );
    });

    it('should exclude events when empty array', () => {
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      spectator.component['form'].patchValue({
        methodName: 'no-events.method',
      });

      spectator.component['form'].patchValue({ events: [] });
      spectator.component['onSubmit']();

      expect(submittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          events: undefined,
        }),
      );
    });
  });

  describe('form interactions', () => {
    it('should emit cancelled event when cancel is clicked', () => {
      const cancelledSpy = jest.spyOn(spectator.component['cancelled'], 'emit');

      spectator.component['onCancel']();

      expect(cancelledSpy).toHaveBeenCalled();
    });

    it('should update events when onEventsChange is called', () => {
      const newEvents: MockEvent[] = [
        {
          delay: 500,
          fields: {
            state: 'RUNNING',
            description: 'New event',
            result: { test: true },
          },
        },
      ];

      spectator.component['onEventsChange'](newEvents);

      expect(spectator.component['form'].value.events).toEqual(newEvents);
    });
  });

  describe('edit mode', () => {
    it('should return true for isEditMode when config is provided', () => {
      spectator.setInput('config', mockConfig);

      expect(spectator.component['isEditMode']).toBe(true);
    });

    it('should return false for isEditMode when config is null', () => {
      spectator.setInput('config', null);

      expect(spectator.component['isEditMode']).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should require methodName field', () => {
      const methodNameControl = spectator.component['form'].controls.methodName;

      expect(methodNameControl.hasError('required')).toBe(true);

      methodNameControl.setValue('test.method');

      expect(methodNameControl.hasError('required')).toBe(false);
    });

    it('should validate responseDelay minimum value', () => {
      const delayControl = spectator.component['form'].controls.responseDelay;

      delayControl.setValue(-100);
      expect(delayControl.hasError('min')).toBe(true);

      delayControl.setValue(0);
      expect(delayControl.hasError('min')).toBe(false);

      delayControl.setValue(1000);
      expect(delayControl.hasError('min')).toBe(false);
    });
  });
});
