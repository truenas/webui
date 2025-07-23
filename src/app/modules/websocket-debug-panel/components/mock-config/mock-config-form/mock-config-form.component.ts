import {
  ChangeDetectionStrategy, Component, OnInit, inject, input, output,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { JobEventBuilderComponent } from 'app/modules/websocket-debug-panel/components/mock-config/job-event-builder/job-event-builder.component';
import { MonacoEditorComponent } from 'app/modules/websocket-debug-panel/components/mock-config/monaco-editor/monaco-editor.component';
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
    responseResult: this.fb.control<unknown>(null),
    responseDelay: [0, [Validators.min(0)]],
    events: [[] as MockEvent[]],
  });

  ngOnInit(): void {
    const configValue = this.config();
    if (configValue) {
      this.form.patchValue({
        methodName: configValue.methodName,
        messagePattern: configValue.messagePattern || '',
        responseResult: configValue.response.result,
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
        result: formValue.responseResult,
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

  protected onResponseChange(value: unknown): void {
    this.form.patchValue({ responseResult: value });
  }

  protected onEventsChange(events: MockEvent[]): void {
    this.form.patchValue({ events });
  }

  protected get isEditMode(): boolean {
    return !!this.config();
  }
}
