import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { JobMockEvent } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';

@Component({
  selector: 'ix-job-event-builder',
  standalone: true,
  imports: [
    FormsModule,
    MatCard,
    MatCardContent,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    TranslateModule,
    IxIconComponent,
  ],
  templateUrl: './job-event-builder.component.html',
  styleUrls: ['./job-event-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobEventBuilderComponent {
  readonly events = input<JobMockEvent[]>([]);
  readonly eventsChange = output<JobMockEvent[]>();

  private getEvents(): JobMockEvent[] {
    return [...this.events()];
  }

  protected addEvent(): void {
    const newEvent: JobMockEvent = {
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
    const events = [...this.getEvents(), newEvent];
    this.eventsChange.emit(events);
  }

  protected removeEvent(index: number): void {
    const events = this.getEvents().filter((_, i) => i !== index);
    this.eventsChange.emit(events);
  }

  protected updateEvent(index: number, field: string, value: unknown): void {
    const updatedEvents = [...this.getEvents()];
    const event = { ...updatedEvents[index] };

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      // Type-safe field update for nested properties
      if (parent === 'progress' && event.fields.progress) {
        event.fields = {
          ...event.fields,
          progress: {
            ...event.fields.progress,
            [child]: value,
          },
        };
      }
    } else if (field === 'delay') {
      event.delay = Number(value) || 2000;
    } else if (field === 'description' && typeof value === 'string') {
      event.fields = {
        ...event.fields,
        description: value,
      };
    } else if (field === 'state' && (value === 'RUNNING' || value === 'SUCCESS' || value === 'FAILED')) {
      event.fields = {
        ...event.fields,
        state: value,
      };
    }

    updatedEvents[index] = event;
    this.eventsChange.emit(updatedEvents);
  }

  protected updateResult(index: number, value: string): void {
    try {
      const parsed = value ? JSON.parse(value) as unknown : undefined;
      const updatedEvents = [...this.getEvents()];
      updatedEvents[index] = {
        ...updatedEvents[index],
        fields: {
          ...updatedEvents[index].fields,
          result: parsed,
        },
      };
      this.eventsChange.emit(updatedEvents);
    } catch {
      // Invalid JSON, ignore
    }
  }

  protected getResultString(event: JobMockEvent): string {
    if (!event.fields.result) return '';
    try {
      return JSON.stringify(event.fields.result, null, 2);
    } catch {
      return '';
    }
  }
}
