import {
  ChangeDetectionStrategy, Component, OnInit, inject, input, output,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { JobEventBuilderComponent } from 'app/modules/websocket-debug-panel/components/mock-config/job-event-builder/job-event-builder.component';
import {
  MockConfig, MockEvent,
} from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { updateMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';

@Component({
  selector: 'ix-mock-config-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButton,
    TranslateModule,
    IxInputComponent,
    IxTextareaComponent,
    JobEventBuilderComponent,
  ],
  templateUrl: './mock-config-form.component.html',
  styleUrls: ['./mock-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigFormComponent implements OnInit {
  readonly config = input<MockConfig | null>(null);
  readonly submitted = output<MockConfig>();
  readonly cancelled = output();

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  protected readonly form = this.fb.group({
    methodName: ['', Validators.required],
    messagePattern: [''],
    responseResult: ['', this.jsonValidator],
    responseDelay: [0, [Validators.min(0)]],
    events: [[] as MockEvent[]],
  });

  ngOnInit(): void {
    const configValue = this.config();
    if (configValue) {
      this.form.patchValue({
        methodName: configValue.methodName,
        messagePattern: configValue.messagePattern || '',
        responseResult: this.stringifyJson(configValue.response.result),
        responseDelay: configValue.response.delay ?? 0,
        events: configValue.events || [],
      });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const configValue = this.config();
    const mockConfig: MockConfig = {
      id: configValue?.id || crypto.randomUUID(),
      enabled: configValue?.enabled ?? true,
      methodName: formValue.methodName ?? '',
      messagePattern: formValue.messagePattern || undefined,
      response: {
        result: this.parseJson(formValue.responseResult ?? ''),
        delay: formValue.responseDelay ?? 0,
      },
      events: formValue.events && formValue.events.length > 0 ? formValue.events : undefined,
    };

    if (configValue) {
      this.store.dispatch(updateMockConfig({ config: mockConfig }));
    }

    this.submitted.emit(mockConfig);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onEventsChange(events: MockEvent[]): void {
    this.form.patchValue({ events });
  }

  private jsonValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (!value || value.trim() === '') {
      return null; // Allow empty values
    }
    try {
      JSON.parse(value);
      return null;
    } catch {
      return { invalidJson: true };
    }
  }

  private stringifyJson(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private parseJson(value: string): unknown {
    if (!value || value.trim() === '') {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value; // Return as string if not valid JSON
    }
  }

  protected get isEditMode(): boolean {
    return !!this.config();
  }
}
