import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, effect, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor, NgControl, ReactiveFormsModule, FormControl, Validators,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnDialog, TnFormFieldComponent, TnSelectComponent, TnSelectOption,
} from '@truenas/ui-components';
import {
  SchedulerModalConfig,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal-config.interface';
import {
  SchedulerModalComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { getDefaultCrontabPresets } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { ignoreTranslation, TranslatedString } from 'app/modules/translate/translate.helper';

@Component({
  selector: 'ix-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CrontabExplanationPipe],
  imports: [
    TnFormFieldComponent,
    TnSelectComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class SchedulerComponent implements ControlValueAccessor {
  controlDirective = inject(NgControl);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private crontabExplanation = inject(CrontabExplanationPipe);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly label = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input(false);
  readonly hideMinutes = input(false);

  /** Sentinel value of the "Create Custom schedule" action option (opens the cron-builder dialog). */
  protected readonly customValue = 'custom';
  /**
   * Optional extra time boundaries for every day, i.e. "15:30" - "23:30"
   */
  readonly startTime = input<string>();
  readonly endTime = input<string>();

  private readonly defaultPresets = getDefaultCrontabPresets(this.translate);

  /** Drives the inner `<tn-select>`. The component mediates between it and the host's form control. */
  protected readonly selectControl = new FormControl<string>('');
  /** Set when the current value is a non-preset crontab; surfaces it as a selectable "Custom" option. */
  protected readonly customCrontab = signal<string | null>(null);

  /** Preset options + an optional "Custom" entry + the "Create Custom schedule" action, fed to `<tn-select>`. */
  protected readonly options = signal<TnSelectOption<string>[]>([]);

  isDisabled = false;
  private crontab: string;
  /** Last real (non-action) value, used to restore the selection when the dialog is cancelled. */
  private previousValue: string | null = null;

  onTouched: () => void = () => {};
  onChange: (crontab: string) => void = () => {};

  constructor() {
    this.controlDirective.valueAccessor = this;

    // Mirror the host's required state onto the inner control so `<tn-form-field>` renders the inline
    // "required" indicator/error: the field reads validity from the `<tn-select>` it wraps, not from
    // the host's form control (which carries the actual validator).
    effect(() => {
      this.selectControl.setValidators(this.required() ? [Validators.required] : []);
      this.selectControl.updateValueAndValidity({ emitEvent: false });
    });

    // Rebuild the options whenever the custom crontab changes (signal-driven, so it stays in sync under OnPush).
    effect(() => this.options.set(this.buildOptions(this.customCrontab())));

    this.selectControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.onSelectionChange(value ?? '');
    });
  }

  registerOnChange(onChange: (crontab: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) {
      this.selectControl.disable({ emitEvent: false });
    } else {
      this.selectControl.enable({ emitEvent: false });
    }
  }

  writeValue(crontab: string): void {
    this.crontab = crontab;
    this.previousValue = crontab;
    const isDefaultPreset = this.defaultPresets.some((preset) => preset.value === crontab);
    this.customCrontab.set(!isDefaultPreset && crontab ? crontab : null);
    this.selectControl.setValue(crontab, { emitEvent: false });
    this.cdr.markForCheck();
  }

  private onSelectionChange(value: string): void {
    if (value === this.customValue) {
      this.onCustomOptionSelected(undefined);
      return;
    }

    this.crontab = value;
    this.previousValue = value;
    const isDefaultPreset = this.defaultPresets.some((preset) => preset.value === value);
    this.customCrontab.set(!isDefaultPreset && value ? value : null);
    this.onChange(value);
    this.onTouched();
  }

  private onCustomOptionSelected(previousValue: string | undefined): void {
    const restoreTo = this.previousValue;
    this.tnDialog.open<SchedulerModalComponent, SchedulerModalConfig, string>(SchedulerModalComponent, {
      width: '760px',
      data: {
        startTime: this.startTime(),
        endTime: this.endTime(),
        hideMinutes: this.hideMinutes(),
        crontab: previousValue,
      },
    })
      .closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newCrontab: string | undefined) => {
        if (!newCrontab) {
          // Cancelled — restore the previously selected value (the select transiently shows the action option).
          this.selectControl.setValue(restoreTo ?? '', { emitEvent: false });
          return;
        }
        const isDefaultPreset = this.defaultPresets.some((preset) => preset.value === newCrontab);
        this.customCrontab.set(isDefaultPreset ? null : newCrontab);
        this.crontab = newCrontab;
        this.previousValue = newCrontab;
        this.selectControl.setValue(newCrontab, { emitEvent: false });
        this.onChange(newCrontab);
        this.cdr.markForCheck();
      });
  }

  private buildOptions(customCrontab: string | null): TnSelectOption<string>[] {
    const presetOptions = this.defaultPresets.map((preset) => ({
      label: ignoreTranslation(preset.description ? `${preset.label} ${preset.description}` : preset.label),
      value: preset.value,
    }));

    const customOption: TnSelectOption<string>[] = customCrontab
      ? [{
          label: ignoreTranslation(`${this.translate.instant('Custom')} ${this.crontabExplanation.transform(customCrontab)}`),
          value: customCrontab,
        }]
      : [];

    const createCustomOption: TnSelectOption<string> = {
      label: ignoreTranslation(`${this.translate.instant('Create')} ${this.translate.instant('Custom schedule')}`),
      value: this.customValue,
    };

    return [...presetOptions, ...customOption, createCustomOption];
  }
}
