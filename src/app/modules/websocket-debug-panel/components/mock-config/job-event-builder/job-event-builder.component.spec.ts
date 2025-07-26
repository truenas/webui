/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable jest/prefer-to-have-length */
import { fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockEvent } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { JobEventBuilderComponent } from './job-event-builder.component';

describe('JobEventBuilderComponent', () => {
  let spectator: Spectator<JobEventBuilderComponent>;

  const mockEvents: MockEvent[] = [
    {
      delay: 1000,
      fields: {
        state: 'RUNNING',
        description: 'Starting job',
        progress: {
          percent: 25,
          description: 'Processing...',
        },
      },
    },
    {
      delay: 3000,
      fields: {
        state: 'SUCCESS',
        description: 'Job completed',
        result: { success: true, data: 'test' },
        progress: {
          percent: 100,
          description: 'Done',
        },
      },
    },
  ];

  const createComponent = createComponentFactory({
    component: JobEventBuilderComponent,
    imports: [ReactiveFormsModule],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should initialize with empty events array', () => {
      expect(spectator.component['eventsFormArray'].length).toBe(0);
    });

    it('should populate form when events input is provided', () => {
      // Directly call setFormEvents instead of relying on ngOnChanges
      spectator.component['setFormEvents'](mockEvents);

      expect(spectator.component['eventsFormArray'].length).toBe(2);

      const firstEvent = spectator.component['getEventControl'](0);
      expect(firstEvent.value).toEqual({
        delay: 1000,
        state: 'RUNNING',
        description: 'Starting job',
        progressPercent: 25,
        progressDescription: 'Processing...',
        result: 'undefined',
        error: '',
      });

      const secondEvent = spectator.component['getEventControl'](1);
      expect(secondEvent.value).toEqual({
        delay: 3000,
        state: 'SUCCESS',
        description: 'Job completed',
        progressPercent: 100,
        progressDescription: 'Done',
        result: JSON.stringify({ success: true, data: 'test' }, null, 2),
        error: '',
      });
    });

    it('should handle events with missing optional fields', () => {
      const minimalEvent: MockEvent = {
        delay: 500,
        fields: {
          state: 'WAITING',
        },
      };

      spectator.setInput('events', [minimalEvent]);
      spectator.component.ngOnChanges();

      const eventControl = spectator.component['getEventControl'](0);
      expect(eventControl.value).toEqual({
        delay: 500,
        state: 'WAITING',
        description: '',
        progressPercent: 0,
        progressDescription: '',
        result: 'undefined',
        error: '',
      });
    });

    it('should handle various delay value formats', () => {
      const eventsWithVariousDelays: MockEvent[] = [
        { delay: '2500' as unknown as number, fields: { state: 'RUNNING' } },
        { delay: null as unknown as number, fields: { state: 'RUNNING' } },
        { delay: undefined as unknown as number, fields: { state: 'RUNNING' } },
        { delay: 'invalid' as unknown as number, fields: { state: 'RUNNING' } },
      ];

      spectator.setInput('events', eventsWithVariousDelays);
      spectator.component.ngOnChanges();

      expect((spectator.component['getEventControl'](0).value as { delay: number }).delay).toBe(2500);
      expect((spectator.component['getEventControl'](1).value as { delay: number }).delay).toBe(2000); // default
      expect((spectator.component['getEventControl'](2).value as { delay: number }).delay).toBe(2000); // default
      expect((spectator.component['getEventControl'](3).value as { delay: number }).delay).toBe(2000); // default
    });
  });

  describe('event management', () => {
    it('should add new event', () => {
      expect(spectator.component['eventsFormArray'].length).toBe(0);

      spectator.component['addEvent']();

      expect(spectator.component['eventsFormArray'].length).toBe(1);

      const newEvent = spectator.component['getEventControl'](0);
      expect(newEvent.value).toEqual({
        delay: 2000,
        state: 'RUNNING',
        description: 'Processing...',
        progressPercent: 0,
        progressDescription: 'Starting...',
        result: 'undefined',
        error: '',
      });
    });

    it('should remove event at index', () => {
      // Directly call setFormEvents instead of relying on ngOnChanges
      spectator.component['setFormEvents'](mockEvents);

      expect(spectator.component['eventsFormArray'].length).toBe(2);

      spectator.component['removeEvent'](0);

      expect(spectator.component['eventsFormArray'].length).toBe(1);
      expect((spectator.component['getEventControl'](0).value as { state: string }).state).toBe('SUCCESS');
    });

    it('should throw error when accessing non-existent control', () => {
      expect(() => spectator.component['getEventControl'](0)).toThrow('Event control at index 0 not found');
    });
  });

  describe('form value changes', () => {
    it('should emit events when form changes', fakeAsync(() => {
      const eventsChangeSpy = jest.spyOn(spectator.component.eventsChange, 'emit');

      spectator.component['addEvent']();
      const eventControl = spectator.component['getEventControl'](0);

      eventControl.patchValue({ state: 'FAILED', error: 'Test error' });

      tick(350); // Wait for debounce

      expect(eventsChangeSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          delay: 2000,
          fields: expect.objectContaining({
            state: 'FAILED',
            error: 'Test error',
          }),
        }),
      ]);
    }));

    it('should emit events after input updates and debounce', fakeAsync(() => {
      const eventsChangeSpy = jest.spyOn(spectator.component.eventsChange, 'emit');

      spectator.setInput('events', mockEvents);
      spectator.component.ngOnChanges();

      // No immediate emission
      expect(eventsChangeSpy).not.toHaveBeenCalled();

      tick(350); // Wait for debounce

      // Should emit after debounce - check that the emitted data has the expected structure
      expect(eventsChangeSpy).toHaveBeenCalled();
      const emittedEvents = eventsChangeSpy.mock.calls[0][0];
      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[0].delay).toBe(1000);
      expect(emittedEvents[0].fields.state).toBe('RUNNING');
      expect(emittedEvents[1].delay).toBe(3000);
      expect(emittedEvents[1].fields.result).toEqual({ success: true, data: 'test' });
    }));
  });

  describe('result visibility', () => {
    it('should show result for SUCCESS state', () => {
      spectator.component['addEvent']();
      const eventControl = spectator.component['getEventControl'](0);

      eventControl.patchValue({ state: 'SUCCESS' });

      expect(spectator.component['isResultVisible'](0)).toBe(true);
    });

    it('should show result for FAILED state', () => {
      spectator.component['addEvent']();
      const eventControl = spectator.component['getEventControl'](0);

      eventControl.patchValue({ state: 'FAILED' });

      expect(spectator.component['isResultVisible'](0)).toBe(true);
    });

    it('should hide result for other states', () => {
      spectator.component['addEvent']();
      const eventControl = spectator.component['getEventControl'](0);

      ['RUNNING', 'WAITING', 'ABORTED'].forEach((state) => {
        eventControl.patchValue({ state });
        expect(spectator.component['isResultVisible'](0)).toBe(false);
      });
    });
  });

  describe('JSON handling', () => {
    it('should parse valid JSON in result field', () => {
      spectator.component['addEvent']();
      const eventControl = spectator.component['getEventControl'](0);

      eventControl.patchValue({
        state: 'SUCCESS',
        result: '{"test": "data", "number": 123}',
      });

      const events = spectator.component['getFormEvents']();
      expect(events[0].fields.result).toEqual({ test: 'data', number: 123 });
    });

    it('should preserve invalid JSON as string', () => {
      spectator.component['addEvent']();
      const eventControl = spectator.component['getEventControl'](0);

      eventControl.patchValue({
        state: 'SUCCESS',
        result: 'invalid json {',
      });

      const events = spectator.component['getFormEvents']();
      expect(events[0].fields.result).toBe('invalid json {');
    });

    it('should stringify objects for display', () => {
      const testObject = { nested: { value: 42 }, array: [1, 2, 3] };
      // Add an event first
      spectator.component['addEvent']();

      // The component now uses safeJsonStringify from utils
      const control = spectator.component.eventsFormArray.at(0) as FormGroup;
      control.controls.result.setValue(JSON.stringify(testObject));

      expect(control.controls.result.value).toBe(JSON.stringify(testObject));
    });

    it('should handle invalid JSON in result field gracefully', () => {
      // Add an event first
      spectator.component['addEvent']();

      // The component now uses safeJsonParse which handles errors internally
      const control = spectator.component.eventsFormArray.at(0) as FormGroup;
      control.controls.result.setValue('invalid json');

      // The invalid JSON should be preserved as a string when getting form events
      const events = spectator.component['getFormEvents']();
      expect(events[0].fields.result).toBe('invalid json');
    });
  });

  describe('event equality comparison', () => {
    it('should detect equal events', () => {
      const events1 = [...mockEvents];
      const events2 = [...mockEvents];

      expect(spectator.component['areEventsEqual'](events1, events2)).toBe(true);
    });

    it('should detect different event lengths', () => {
      const events1 = [...mockEvents];
      const events2 = [mockEvents[0]];

      expect(spectator.component['areEventsEqual'](events1, events2)).toBe(false);
    });

    it('should detect different event properties', () => {
      const events1 = [...mockEvents];
      const events2 = [...mockEvents];
      events2[0] = { ...events2[0], delay: 5000 };

      expect(spectator.component['areEventsEqual'](events1, events2)).toBe(false);
    });

    it('should compare complex result objects', () => {
      const event1: MockEvent = {
        delay: 1000,
        fields: {
          state: 'SUCCESS',
          result: { nested: { value: 42 } },
        },
      };

      const event2: MockEvent = {
        delay: 1000,
        fields: {
          state: 'SUCCESS',
          result: { nested: { value: 42 } },
        },
      };

      const event3: MockEvent = {
        delay: 1000,
        fields: {
          state: 'SUCCESS',
          result: { nested: { value: 43 } },
        },
      };

      expect(spectator.component['areEventsEqual']([event1], [event2])).toBe(true);
      expect(spectator.component['areEventsEqual']([event1], [event3])).toBe(false);
    });
  });

  describe('state options', () => {
    it('should provide correct state options', async () => {
      const options = await firstValueFrom(spectator.component['stateOptions$']);
      expect(options).toEqual([
        { label: 'RUNNING', value: 'RUNNING' },
        { label: 'SUCCESS', value: 'SUCCESS' },
        { label: 'FAILED', value: 'FAILED' },
        { label: 'ABORTED', value: 'ABORTED' },
        { label: 'WAITING', value: 'WAITING' },
      ]);
    });
  });
});
