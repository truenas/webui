import {
  ChangeDetectionStrategy, Component, OnInit, OnChanges, inject, input, output,
} from '@angular/core';
import {
  FormArray, FormBuilder, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MockEvent } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { parseDelay, safeJsonParse, safeJsonStringify } from 'app/modules/websocket-debug-panel/utils/type-guards';

@UntilDestroy()
@Component({
  selector: 'ix-job-event-builder',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButton,
    MatIconButton,
    TranslateModule,
    IxIconComponent,
    IxInputComponent,
    IxSelectComponent,
    IxTextareaComponent,
  ],
  templateUrl: './job-event-builder.component.html',
  styleUrls: ['./job-event-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobEventBuilderComponent implements OnInit, OnChanges {
  readonly events = input<MockEvent[]>([]);
  readonly eventsChange = output<MockEvent[]>();

  private readonly fb = inject(FormBuilder);
  private isUpdatingFromInput = false;

  protected readonly stateOptions$ = of<SelectOption[]>([
    { label: 'RUNNING', value: 'RUNNING' },
    { label: 'SUCCESS', value: 'SUCCESS' },
    { label: 'FAILED', value: 'FAILED' },
    { label: 'ABORTED', value: 'ABORTED' },
    { label: 'WAITING', value: 'WAITING' },
  ]);

  protected form = this.fb.group({
    events: this.fb.array<FormGroup>([]),
  });

  constructor() {
    // Emit changes when form updates with debounce to prevent partial values
    this.form.valueChanges.pipe(
      debounceTime(300),
      untilDestroyed(this),
    ).subscribe(() => {
      if (!this.isUpdatingFromInput) {
        const formEvents = this.getFormEvents();
        this.eventsChange.emit(formEvents);
      }
    });
  }

  ngOnChanges(): void {
    // Only update if the events actually changed to prevent feedback loops
    const newEvents = this.events();
    const currentEvents = this.getFormEvents();

    if (!this.areEventsEqual(newEvents, currentEvents)) {
      this.setFormEvents(newEvents);
    }
  }

  ngOnInit(): void {
    this.setFormEvents(this.events());
  }

  get eventsFormArray(): FormArray {
    return this.form.controls.events;
  }

  private createEventFormGroup(event: MockEvent): FormGroup {
    const delayValue = parseDelay(event.delay);

    return this.fb.group({
      delay: [delayValue],
      state: [event.fields.state],
      description: [event.fields.description || ''],
      progressPercent: [event.fields.progress?.percent !== undefined && event.fields.progress?.percent !== null
        ? event.fields.progress.percent
        : 0],
      progressDescription: [event.fields.progress?.description || ''],
      result: [safeJsonStringify(event.fields.result)],
      error: [event.fields.error || ''],
    });
  }

  private setFormEvents(events: MockEvent[]): void {
    this.isUpdatingFromInput = true;
    this.eventsFormArray.clear();
    events.forEach((event) => {
      this.eventsFormArray.push(this.createEventFormGroup(event));
    });
    this.isUpdatingFromInput = false;
  }

  private getFormEvents(): MockEvent[] {
    return this.eventsFormArray.controls.map((control) => {
      const formGroup = control as FormGroup;
      const value = formGroup.value as {
        delay: number;
        state: string;
        description: string;
        progressPercent: number;
        progressDescription: string;
        result: string;
        error: string;
      };
      const event: MockEvent = {
        delay: parseDelay(value.delay),
        fields: {
          state: value.state as MockEvent['fields']['state'],
          description: value.description || null,
          progress: {
            percent: value.progressPercent !== undefined && value.progressPercent !== null
              ? Number(value.progressPercent)
              : 0,
            description: value.progressDescription || '',
          },
        },
      };

      if (value.result) {
        event.fields.result = safeJsonParse(value.result, value.result);
      }

      if (value.error) {
        event.fields.error = value.error;
      }

      return event;
    });
  }

  protected addEvent(): void {
    const newEvent: MockEvent = {
      delay: 2000,
      fields: {
        description: 'Processing...',
        progress: {
          percent: 0,
          description: 'Starting...',
        },
        state: 'RUNNING',
      },
    };
    this.eventsFormArray.push(this.createEventFormGroup(newEvent));
  }

  protected removeEvent(index: number): void {
    this.eventsFormArray.removeAt(index);
  }

  protected getEventControl(index: number): FormGroup {
    const control = this.eventsFormArray.at(index);
    if (!control) {
      throw new Error(`Event control at index ${index} not found`);
    }
    return control as FormGroup;
  }

  protected isResultVisible(index: number): boolean {
    const control = this.getEventControl(index);
    const state = control.controls.state?.value as string;
    return state === 'SUCCESS' || state === 'FAILED';
  }

  private areEventsEqual(events1: MockEvent[], events2: MockEvent[]): boolean {
    if (events1.length !== events2.length) {
      return false;
    }

    return events1.every((event1, index) => {
      const event2 = events2[index];

      // Compare basic properties
      if (event1.delay !== event2.delay) {
        return false;
      }

      // Compare fields
      const fields1 = event1.fields;
      const fields2 = event2.fields;

      if (fields1.state !== fields2.state
        || fields1.description !== fields2.description
        || fields1.error !== fields2.error) {
        return false;
      }

      // Compare progress
      if (fields1.progress?.percent !== fields2.progress?.percent
        || fields1.progress?.description !== fields2.progress?.description) {
        return false;
      }

      // Compare result (both could be undefined/null or objects)
      if (fields1.result !== fields2.result) {
        // If they're not strictly equal, check if they're both objects
        if (typeof fields1.result === 'object' && typeof fields2.result === 'object') {
          // Simple object comparison - could be enhanced for nested objects
          return JSON.stringify(fields1.result) === JSON.stringify(fields2.result);
        }
        return false;
      }

      return true;
    });
  }
}
