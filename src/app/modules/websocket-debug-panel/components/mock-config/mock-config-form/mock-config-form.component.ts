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
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { RadioOption, SelectOption } from 'app/interfaces/option.interface';
import { SimpleComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-combobox-provider';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { JobEventBuilderComponent } from 'app/modules/websocket-debug-panel/components/mock-config/job-event-builder/job-event-builder.component';
import {
  MockConfig, MockEvent, CallErrorData,
  isErrorResponse, isSuccessResponse, isCallErrorData,
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
    IxRadioGroupComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxCodeEditorComponent,
    IxCheckboxComponent,
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
  protected readonly responseTypeOptions: Observable<RadioOption[]> = of([
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
    { label: '-32001 - CallError', value: JsonRpcErrorCode.CallError },
    // Application specific codes
    { label: '1 - General error', value: 1 },
    { label: '2 - Not found', value: 2 },
    { label: '3 - Permission denied', value: 3 },
    { label: '22 - Invalid argument', value: 22 },
  ]);

  // Common API error names for CallError
  protected readonly errorNameOptions: Observable<SelectOption[]> = of([
    { label: 'EINVAL - Invalid argument', value: ApiErrorName.Validation },
    { label: 'EACCES - Access denied', value: ApiErrorName.NoAccess },
    { label: 'ENOTAUTHENTICATED - Not authenticated', value: ApiErrorName.NotAuthenticated },
    { label: 'ENOMEM - No memory', value: ApiErrorName.NoMemory },
    { label: 'EEXIST - Already exists', value: ApiErrorName.AlreadyExists },
    { label: 'EAGAIN - Try again', value: ApiErrorName.Again },
  ]);

  protected readonly form = this.fb.group({
    methodName: ['', Validators.required],
    messagePattern: [''],
    responseType: ['success' as 'success' | 'error', Validators.required],
    responseResult: ['', this.jsonValidator],
    errorCode: [0],
    errorMessage: [''],
    errorData: ['', this.jsonValidator],
    // CallError specific fields
    isCallError: [false],
    callErrorErrname: [''],
    callErrorCode: [0], // Integer error code (e.g., 22 for EINVAL)
    callErrorReason: [''],
    callErrorExtra: ['', this.jsonValidator],
    callErrorTrace: ['', this.jsonValidator],
    responseDelay: [0, [Validators.min(0)]],
    events: [[] as MockEvent[]],
  });

  ngOnInit(): void {
    const configValue = this.config();
    if (configValue) {
      const response = configValue.response;
      const isError = response && isErrorResponse(response);
      const isCallErr = isError && response.error.code === (JsonRpcErrorCode.CallError as number);
      const callErrData = isError && isCallErrorData(response.error.data)
        ? response.error.data as CallErrorData
        : null;

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
        errorData: isError && !isCallErr
          ? this.stringifyJson(response.error.data)
          : '',
        isCallError: isCallErr,
        callErrorErrname: callErrData?.errname || '',
        callErrorCode: callErrData?.error || 0,
        callErrorReason: callErrData?.reason || '',
        callErrorExtra: callErrData?.extra
          ? this.stringifyJson(callErrData.extra)
          : '',
        callErrorTrace: callErrData?.trace
          ? this.stringifyJson(callErrData.trace)
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
      .subscribe(() => {
        if (this.isErrorMode) {
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

    // Watch for error code changes to auto-toggle CallError mode
    this.form.controls.errorCode.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const isCallErr = code === (JsonRpcErrorCode.CallError as number);
        if (isCallErr !== this.form.controls.isCallError.value) {
          this.form.patchValue({ isCallError: isCallErr });
        }
      });

    // Watch for isCallError changes to update error code and generate defaults
    this.form.controls.isCallError.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isCallError) => {
        if (isCallError) {
          if (this.form.controls.errorCode.value !== (JsonRpcErrorCode.CallError as number)) {
            this.form.patchValue({ errorCode: JsonRpcErrorCode.CallError });
          }
          // Set default values for CallError if fields are empty
          const updates: Partial<typeof this.form.value> = {};
          if (!this.form.controls.callErrorTrace.value) {
            updates.callErrorTrace = this.generateDefaultTrace();
          }
          if (!this.form.controls.callErrorErrname.value) {
            updates.callErrorErrname = ApiErrorName.Validation; // Default to EINVAL
          }
          if (!this.form.controls.callErrorCode.value) {
            updates.callErrorCode = 22; // EINVAL error code
          }
          if (!this.form.controls.callErrorReason.value) {
            updates.callErrorReason = 'Invalid argument provided';
          }
          if (!this.form.controls.errorMessage.value) {
            updates.errorMessage = 'Invalid argument';
          }
          if (Object.keys(updates).length > 0) {
            this.form.patchValue(updates);
          }
        }
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const configValue = this.config();
    // Build error data based on whether it's a CallError
    let errorData: unknown = undefined;
    if (formValue.responseType === 'error') {
      if (formValue.isCallError) {
        // Build CallError data structure - include all required fields for isApiErrorDetails check
        // Parse trace or use a minimal default trace structure
        let trace: CallErrorData['trace'];
        if (formValue.callErrorTrace) {
          trace = this.parseJson(formValue.callErrorTrace) as CallErrorData['trace'];
        } else {
          // Provide minimal trace structure so isApiErrorDetails check passes
          trace = {
            class: 'CallError',
            formatted: 'No stack trace available',
            frames: [],
          };
        }

        const callErrorData: CallErrorData = {
          errname: formValue.callErrorErrname || 'EINVAL',
          error: formValue.callErrorCode ?? 0,
          reason: formValue.callErrorReason || 'Error occurred',
          extra: formValue.callErrorExtra ? this.parseJson(formValue.callErrorExtra) : null,
          trace,
        };
        errorData = callErrorData;
      } else if (formValue.errorData) {
        errorData = this.parseJson(formValue.errorData);
      }
    }

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
              data: errorData,
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
    } catch (error) {
      return {
        invalidJson: {
          message: `Invalid JSON format: ${(error as Error).message}`,
        },
      };
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

  protected get isErrorMode(): boolean {
    return this.form.controls.responseType.value === 'error';
  }

  protected get isCallErrorMode(): boolean {
    return this.form.controls.isCallError.value === true;
  }

  private generateDefaultTrace(): string {
    // Generate a default mock trace for CallError with correct ApiTraceFrame structure
    const defaultTrace = {
      class: 'CallError',
      formatted: `Traceback (most recent call last):
  File "/usr/local/lib/python3/middlewared/main.py", line 176, in call_method
    result = await self.middleware.call_method(self, message)
  File "/usr/local/lib/python3/middlewared/main.py", line 1335, in call_method
    return await self._call(message['method'], serviceobj, methodobj, params, app=app)
  File "/usr/local/lib/python3/middlewared/main.py", line 1285, in _call
    return await methodobj(*prepared_call.args)
  File "/usr/local/lib/python3/middlewared/service.py", line 195, in create
    verrors = ValidationErrors()
  File "/usr/local/lib/python3/middlewared/service.py", line 198, in create
    raise CallError('Invalid argument provided', errno.EINVAL)
middlewared.service_exception.CallError: [EINVAL] Invalid argument provided`,
      frames: [
        {
          argspec: ['self', 'message'],
          filename: '/usr/local/lib/python3/middlewared/main.py',
          line: '    result = await self.middleware.call_method(self, message)',
          lineno: 176,
          locals: {
            self: '<WebSocketApplication object>',
            message: '{"method": "pool.create", "params": [{"name": "tank", "vdevs": [...]}]}',
          },
          method: 'call_method',
        },
        {
          argspec: ['self', 'message', 'serviceobj', 'methodobj', 'params', 'app'],
          filename: '/usr/local/lib/python3/middlewared/main.py',
          line: '    return await methodobj(*prepared_call.args)',
          lineno: 1285,
          locals: {
            self: '<Middleware object>',
            methodobj: '<bound method PoolService.create>',
            params: '[{"name": "tank", "vdevs": [...]}]',
            app: 'None',
          },
          method: '_call',
        },
        {
          argspec: ['self', 'data'],
          filename: '/usr/local/lib/python3/middlewared/service.py',
          line: "    raise CallError('Invalid argument provided', errno.EINVAL)",
          lineno: 198,
          locals: {
            self: '<PoolService object>',
            data: '{"name": "tank", "vdevs": [...]}',
            verrors: '<ValidationErrors object>',
          },
          method: 'create',
        },
      ],
    };
    return JSON.stringify(defaultTrace, null, 2);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
