import {
  ChangeDetectionStrategy, Component, OnInit, inject, input, output, OnDestroy,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { SelectOption } from 'app/interfaces/option.interface';
import { SimpleComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-combobox-provider';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { JobEventBuilderComponent } from 'app/modules/websocket-debug-panel/components/mock-config/job-event-builder/job-event-builder.component';
import {
  MockConfig, MockEvent,
  isErrorResponse, isSuccessResponse,
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
    IxSelectComponent,
    IxComboboxComponent,
    IxCodeEditorComponent,
    JobEventBuilderComponent,
  ],
  templateUrl: './mock-config-form.component.html',
  styleUrls: ['./mock-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigFormComponent implements OnInit, OnDestroy {
  readonly config = input<MockConfig | null>(null);
  readonly submitted = output<MockConfig>();
  readonly cancelled = output();

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly destroy$ = new Subject<void>();

  protected readonly CodeEditorLanguage = CodeEditorLanguage;
  protected readonly responseTypeOptions: Observable<SelectOption[]> = of([
    { label: 'Success', value: 'success' },
    { label: 'Error', value: 'error' },
  ]);

  // Common JSON-RPC error codes
  protected readonly errorCodeProvider: IxComboboxProvider = new SimpleComboboxProvider([
    // Standard JSON-RPC 2.0 error codes
    { label: '-32700 - Parse error', value: -32700 },
    { label: '-32600 - Invalid Request', value: -32600 },
    { label: '-32601 - Method not found', value: -32601 },
    { label: '-32602 - Invalid params', value: -32602 },
    { label: '-32603 - Internal error', value: -32603 },
    // Server errors
    { label: '-32000 - Server error (generic)', value: -32000 },
    // Application specific codes
    { label: '1 - General error', value: 1 },
    { label: '2 - Not found', value: 2 },
    { label: '3 - Permission denied', value: 3 },
    { label: '22 - Invalid argument', value: 22 },
  ]);

  protected readonly form = this.fb.group({
    methodName: ['', Validators.required],
    messagePattern: [''],
    responseType: ['success' as 'success' | 'error', Validators.required],
    responseResult: ['', this.jsonValidator],
    errorCode: [0],
    errorMessage: [''],
    errorData: [''],
    responseDelay: [0, [Validators.min(0)]],
    events: [[] as MockEvent[]],
  });

  ngOnInit(): void {
    const configValue = this.config();
    if (configValue) {
      const response = configValue.response;
      const isError = response && isErrorResponse(response);
      this.form.patchValue({
        methodName: configValue.methodName,
        messagePattern: configValue.messagePattern || '',
        responseType: response?.type || 'success',
        responseResult: response && isSuccessResponse(response)
          ? this.stringifyJson(response.result)
          : '',
        errorCode: isError
          ? response.error.code
          : 0,
        errorMessage: isError
          ? response.error.message
          : '',
        errorData: isError
          ? this.stringifyJson(response.error.data)
          : '',
        responseDelay: response?.delay ?? 0,
        events: configValue.events || [],
      });
    } else {
      // Set default value for new configs
      this.form.patchValue({
        responseType: 'success',
      });
    }

    // Toggle validators based on response type
    this.form.controls.responseType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        if (type === 'error') {
          this.form.controls.responseResult.clearValidators();
          this.form.controls.errorCode.setValidators([Validators.required]);
          this.form.controls.errorMessage.setValidators(Validators.required);
        } else {
          this.form.controls.responseResult.setValidators(this.jsonValidator);
          this.form.controls.errorCode.clearValidators();
          this.form.controls.errorMessage.clearValidators();
        }
        this.form.controls.responseResult.updateValueAndValidity();
        this.form.controls.errorCode.updateValueAndValidity();
        this.form.controls.errorMessage.updateValueAndValidity();
      });
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
      response: formValue.responseType === 'error'
        ? {
            type: 'error',
            error: {
              code: formValue.errorCode ?? 0,
              message: formValue.errorMessage ?? '',
              data: formValue.errorData ? this.parseJson(formValue.errorData) : undefined,
            },
            delay: formValue.responseDelay ?? 0,
          }
        : {
            type: 'success',
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
