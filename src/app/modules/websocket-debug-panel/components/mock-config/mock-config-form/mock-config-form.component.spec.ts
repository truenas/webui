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
      type: 'success',
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
        responseType: 'success',
        responseResult: '',
        errorCode: 0,
        errorMessage: '',
        errorData: '',
        isCallError: false,
        callErrorErrname: '',
        callErrorCode: 0,
        callErrorReason: '',
        callErrorExtra: '',
        callErrorTrace: '',
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
        responseType: 'success',
        responseResult: '{\n  "success": true\n}',
        errorCode: 0,
        errorMessage: '',
        errorData: '',
        isCallError: false,
        callErrorErrname: '',
        callErrorCode: 0,
        callErrorReason: '',
        callErrorExtra: '',
        callErrorTrace: '',
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
          type: 'success',
          result: null,
        },
      };

      spectator.setInput('config', minimalConfig);
      spectator.component['ngOnInit']();

      expect(spectator.component['form'].value).toEqual({
        methodName: 'minimal.method',
        messagePattern: '',
        responseType: 'success',
        responseResult: '',
        errorCode: 0,
        errorMessage: '',
        errorData: '',
        isCallError: false,
        callErrorErrname: '',
        callErrorCode: 0,
        callErrorReason: '',
        callErrorExtra: '',
        callErrorTrace: '',
        responseDelay: 0,
        events: [],
      });
    });

    it('should handle CallError configuration', () => {
      const callErrorConfig: MockConfig = {
        id: 'test-call-error',
        enabled: true,
        methodName: 'test.callerror',
        response: {
          type: 'error',
          error: {
            code: -32001,
            message: 'Call error occurred',
            data: {
              errname: 'EINVAL',
              error: 22,
              reason: 'Invalid input provided',
              extra: { field: 'test_field', error: 'required' },
              trace: {
                class: 'ValidationError',
                formatted: 'Mock traceback',
                frames: [{
                  argspec: ['self'],
                  filename: 'test.py',
                  line: 'test line',
                  lineno: 1,
                  locals: {},
                  method: 'test',
                }],
              },
            },
          },
        },
      };

      spectator.setInput('config', callErrorConfig);
      spectator.component['ngOnInit']();

      expect(spectator.component['form'].value).toEqual({
        methodName: 'test.callerror',
        messagePattern: '',
        responseType: 'error',
        responseResult: '',
        errorCode: -32001,
        errorMessage: 'Call error occurred',
        errorData: '',
        isCallError: true,
        callErrorErrname: 'EINVAL',
        callErrorCode: 22,
        callErrorReason: 'Invalid input provided',
        callErrorExtra: '{\n  "field": "test_field",\n  "error": "required"\n}',
        callErrorTrace: '{\n  "class": "ValidationError",\n  "formatted": "Mock traceback",\n  "frames": [\n    {\n      "argspec": [\n        "self"\n      ],\n      "filename": "test.py",\n      "line": "test line",\n      "lineno": 1,\n      "locals": {},\n      "method": "test"\n    }\n  ]\n}',
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
          type: 'success',
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

    it('should not submit when JSON fields have invalid JSON', () => {
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      spectator.component['form'].patchValue({
        methodName: 'test.method',
        responseType: 'error',
        isCallError: true,
        errorCode: -32001,
        errorMessage: 'Test error',
        callErrorExtra: '{invalid json}', // Invalid JSON
      });

      spectator.component['onSubmit']();

      expect(submittedSpy).not.toHaveBeenCalled();
      expect(spectator.component['form'].invalid).toBe(true);
    });
  });

  describe('CallError specific behavior', () => {
    it('should generate default trace when CallError is enabled', () => {
      // Initialize the component to set up watchers
      spectator.component.ngOnInit();

      // Initially set as non-CallError
      spectator.component['form'].patchValue({
        responseType: 'error',
        errorCode: -32600,
        isCallError: false,
      });

      // Toggle isCallError to true
      spectator.component['form'].patchValue({
        isCallError: true,
      });

      // Should have generated a default trace
      const traceValue = spectator.component['form'].value.callErrorTrace;
      expect(traceValue).toBeTruthy();
      expect(typeof traceValue).toBe('string');

      // Verify it's valid JSON with correct structure
      const trace = JSON.parse(traceValue as string);
      expect(trace).toBeDefined();
      expect(trace.class).toBe('CallError');
      expect(trace.formatted).toBeDefined();
      expect(trace.frames).toBeDefined();
      expect(Array.isArray(trace.frames)).toBe(true);
      expect(trace.frames.length).toBeGreaterThan(0);
    });

    it('should set isCallError when error code is -32001', () => {
      // Initialize the component to set up watchers
      spectator.component.ngOnInit();

      spectator.component['form'].patchValue({
        responseType: 'error',
        errorCode: -32001,
      });

      expect(spectator.component['form'].value.isCallError).toBe(true);
    });

    it('should set default CallError values when enabled', () => {
      // Initialize the component to set up watchers
      spectator.component.ngOnInit();

      // Enable CallError mode
      spectator.component['form'].patchValue({
        responseType: 'error',
        isCallError: true,
      });

      const formValue = spectator.component['form'].value;

      // Check that default values are set
      expect(formValue.errorCode).toBe(-32001);
      expect(formValue.callErrorErrname).toBe('EINVAL');
      expect(formValue.callErrorCode).toBe(22);
      expect(formValue.callErrorReason).toBe('Invalid argument provided');
      expect(formValue.errorMessage).toBe('Invalid argument');
      expect(formValue.callErrorTrace).toBeTruthy();

      // Verify trace contains CallError
      const trace = JSON.parse(formValue.callErrorTrace as string);
      expect(trace.class).toBe('CallError');
      expect(trace.formatted).toContain('CallError');
      expect(trace.formatted).toContain('EINVAL');
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

  describe('computed properties', () => {
    it('should return true for isErrorMode when responseType is error', () => {
      spectator.component['form'].patchValue({ responseType: 'error' });

      expect(spectator.component['isErrorMode']).toBe(true);
    });

    it('should return false for isErrorMode when responseType is success', () => {
      spectator.component['form'].patchValue({ responseType: 'success' });

      expect(spectator.component['isErrorMode']).toBe(false);
    });

    it('should return true for isCallErrorMode when isCallError is true', () => {
      spectator.component['form'].patchValue({ isCallError: true });

      expect(spectator.component['isCallErrorMode']).toBe(true);
    });

    it('should return false for isCallErrorMode when isCallError is false', () => {
      spectator.component['form'].patchValue({ isCallError: false });

      expect(spectator.component['isCallErrorMode']).toBe(false);
    });
  });

  describe('JSON validation and handling', () => {
    it('should validate invalid JSON in responseResult field', () => {
      spectator.component['form'].patchValue({
        responseType: 'success',
        responseResult: '{invalid json}',
      });

      const control = spectator.component['form'].controls.responseResult;
      expect(control.errors?.['invalidJson']).toBeDefined();
      expect(control.errors?.['invalidJson'].message).toContain('Invalid JSON format');
    });

    it('should validate invalid JSON in callErrorTrace field', () => {
      spectator.component['form'].patchValue({
        responseType: 'error',
        isCallError: true,
        callErrorTrace: 'not valid json',
      });

      const control = spectator.component['form'].controls.callErrorTrace;
      expect(control.errors?.['invalidJson']).toBeDefined();
      expect(control.errors?.['invalidJson'].message).toContain('Invalid JSON format');
    });

    it('should validate invalid JSON in callErrorExtra field', () => {
      spectator.component['form'].patchValue({
        responseType: 'error',
        isCallError: true,
        callErrorExtra: '{bad json',
      });

      const control = spectator.component['form'].controls.callErrorExtra;
      expect(control.errors?.['invalidJson']).toBeDefined();
      expect(control.errors?.['invalidJson'].message).toContain('Invalid JSON format');
    });

    it('should validate invalid JSON in errorData field', () => {
      spectator.component['form'].patchValue({
        responseType: 'error',
        isCallError: false,
        errorData: 'invalid: json: data',
      });

      const control = spectator.component['form'].controls.errorData;
      expect(control.errors?.['invalidJson']).toBeDefined();
      expect(control.errors?.['invalidJson'].message).toContain('Invalid JSON format');
    });

    it('should allow valid JSON in callErrorExtra field', () => {
      spectator.component['form'].patchValue({
        callErrorExtra: '{"valid": "json"}',
      });

      const control = spectator.component['form'].controls.callErrorExtra;
      expect(control.errors).toBeNull();
    });

    it('should allow valid JSON in errorData field', () => {
      spectator.component['form'].patchValue({
        errorData: '{"error": {"nested": true}}',
      });

      const control = spectator.component['form'].controls.errorData;
      expect(control.errors).toBeNull();
    });

    it('should allow empty JSON fields', () => {
      spectator.component['form'].patchValue({
        responseResult: '',
        callErrorTrace: '',
        callErrorExtra: '',
        errorData: '',
      });

      expect(spectator.component['form'].controls.responseResult.errors).toBeNull();
      expect(spectator.component['form'].controls.callErrorTrace.errors).toBeNull();
      expect(spectator.component['form'].controls.callErrorExtra.errors).toBeNull();
      expect(spectator.component['form'].controls.errorData.errors).toBeNull();
    });

    it('should show specific JSON parsing error in message', () => {
      spectator.component['form'].patchValue({
        responseResult: '{"unclosed": ',
      });

      const control = spectator.component['form'].controls.responseResult;
      expect(control.errors?.['invalidJson']).toBeDefined();
      expect(control.errors?.['invalidJson'].message).toContain('Unexpected end of JSON input');
    });

    it('should stringify non-string values in stringifyJson', () => {
      const obj = { test: 'value', nested: { key: 123 } };
      const result = spectator.component['stringifyJson'](obj);
      expect(result).toBe(JSON.stringify(obj, null, 2));
    });

    it('should handle string values in stringifyJson', () => {
      const str = 'already a string';
      const result = spectator.component['stringifyJson'](str);
      expect(result).toBe(str);
    });

    it('should handle values that cannot be stringified', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      const result = spectator.component['stringifyJson'](circular);
      expect(result).toBe('[object Object]');
    });

    it('should parse invalid JSON as string in parseJson', () => {
      const invalidJson = 'not json';
      const result = spectator.component['parseJson'](invalidJson);
      expect(result).toBe(invalidJson);
    });

    it('should handle empty string in parseJson', () => {
      const result = spectator.component['parseJson']('');
      expect(result).toBeNull();
    });
  });

  describe('CallError submission handling', () => {
    it('should build CallError data with empty trace field', () => {
      spectator.component.ngOnInit();
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      spectator.component['form'].patchValue({
        methodName: 'test.method',
        responseType: 'error',
        isCallError: true,
        errorCode: -32001,
        errorMessage: 'Test error',
        callErrorErrname: 'ETEST',
        callErrorCode: 99,
        callErrorReason: 'Test reason',
        callErrorTrace: '', // Empty trace
        callErrorExtra: '{"extra": "data"}',
      });

      spectator.component['onSubmit']();

      expect(submittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            type: 'error',
            error: expect.objectContaining({
              data: expect.objectContaining({
                trace: {
                  class: 'CallError',
                  formatted: 'No stack trace available',
                  frames: [],
                },
              }),
            }),
          }),
        }),
      );
    });

    it('should build CallError data with parsed trace', () => {
      spectator.component.ngOnInit();
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      const validTrace = {
        class: 'CallError',
        formatted: 'Test trace',
        frames: [{ method: 'test' }],
      };

      spectator.component['form'].patchValue({
        methodName: 'test.method',
        responseType: 'error',
        isCallError: true,
        errorCode: -32001,
        errorMessage: 'Test error',
        callErrorErrname: 'ETEST',
        callErrorCode: 99,
        callErrorReason: 'Test reason',
        callErrorTrace: JSON.stringify(validTrace),
        callErrorExtra: null,
      });

      spectator.component['onSubmit']();

      expect(submittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            type: 'error',
            error: expect.objectContaining({
              data: expect.objectContaining({
                trace: validTrace,
                extra: null,
              }),
            }),
          }),
        }),
      );
    });

    it('should build non-CallError error data', () => {
      spectator.component.ngOnInit();
      const submittedSpy = jest.spyOn(spectator.component['submitted'], 'emit');

      spectator.component['form'].patchValue({
        methodName: 'test.method',
        responseType: 'error',
        isCallError: false,
        errorCode: -32600,
        errorMessage: 'Generic error',
        errorData: '{"custom": "error data"}',
      });

      spectator.component['onSubmit']();

      expect(submittedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({
            type: 'error',
            error: expect.objectContaining({
              data: { custom: 'error data' },
            }),
          }),
        }),
      );
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

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject on component destroy', () => {
      const destroySubject$ = spectator.component['destroy$'];
      const nextSpy = jest.spyOn(destroySubject$, 'next');
      const completeSpy = jest.spyOn(destroySubject$, 'complete');

      spectator.component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
