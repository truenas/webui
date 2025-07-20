import {
  ChangeDetectionStrategy, Component, OnInit, inject, input, output,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatError, MatFormField, MatLabel, MatHint,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { JobEventBuilderComponent } from 'app/modules/websocket-debug-panel/components/mock-config/job-event-builder/job-event-builder.component';
import { MonacoEditorComponent } from 'app/modules/websocket-debug-panel/components/mock-config/monaco-editor/monaco-editor.component';
import {
  MockConfig, CallMockResponse, JobMockResponse, JobMockEvent,
} from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { updateMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';

@Component({
  selector: 'ix-mock-config-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatInputModule,
    MatError,
    MatButton,
    MatRadioGroup,
    MatRadioButton,
    TranslateModule,
    MonacoEditorComponent,
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
    type: ['call' as 'call' | 'job', Validators.required],
    callResponse: this.fb.group({
      result: this.fb.control<unknown>(null),
    }),
    jobResponse: this.fb.group({
      events: [[] as JobMockEvent[]],
    }),
  });

  ngOnInit(): void {
    const configValue = this.config();
    if (configValue) {
      this.form.patchValue({
        methodName: configValue.methodName,
        messagePattern: configValue.messagePattern || '',
        type: configValue.type,
      });

      if (configValue.type === 'call') {
        const response = configValue.response as CallMockResponse;
        this.form.controls.callResponse.patchValue({
          result: response.result,
        });
      } else {
        const response = configValue.response as JobMockResponse;
        this.form.controls.jobResponse.patchValue({
          events: response.events,
        });
      }
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
      type: formValue.type ?? 'call',
      response: formValue.type === 'call'
        ? { result: formValue.callResponse?.result } as CallMockResponse
        : { events: formValue.jobResponse?.events ?? [] } as JobMockResponse,
    };

    if (configValue) {
      this.store.dispatch(updateMockConfig({ config: mockConfig }));
    }

    this.submitted.emit(mockConfig);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onCallResponseChange(value: unknown): void {
    this.form.controls.callResponse.patchValue({ result: value });
  }

  protected onJobEventsChange(events: JobMockEvent[]): void {
    this.form.controls.jobResponse.patchValue({ events });
  }

  protected get isEditMode(): boolean {
    return !!this.config();
  }

  protected get currentType(): 'call' | 'job' {
    return this.form.controls.type.value ?? 'call';
  }
}
