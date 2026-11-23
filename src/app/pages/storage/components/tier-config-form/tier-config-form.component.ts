import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnBannerComponent, TnCheckboxComponent,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { helptextTiering } from 'app/helptext/storage/tiering';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-tier-config-form',
  templateUrl: './tier-config-form.component.html',
  styleUrls: ['./tier-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnInputComponent,
    TnBannerComponent,
    TranslateModule,
  ],
})
export class TierConfigFormComponent extends IxFormHostForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly InputType = InputType;

  protected showEnabledWarning = signal(false);

  protected readonly helptext = helptextTiering;

  // Bounds mirror the zfs.tier.update API schema and are interpolated into the field hints.
  protected readonly concurrentJobsRange = { min: 1, max: 10 };
  protected readonly maxUsedRange = { min: 70, max: 95 };
  protected readonly reserveRange = { min: 10, max: 30 };

  private static readonly defaultMaxConcurrentJobs = 1;
  private static readonly defaultMaxUsedPercent = 80;
  private static readonly defaultReservePercent = 25;

  protected readonly form = this.fb.nonNullable.group({
    enabled: [false],
    max_concurrent_jobs: [
      TierConfigFormComponent.defaultMaxConcurrentJobs,
      [
        Validators.required,
        Validators.min(this.concurrentJobsRange.min),
        Validators.max(this.concurrentJobsRange.max),
      ],
    ],
    max_used_percentage: [
      TierConfigFormComponent.defaultMaxUsedPercent,
      [Validators.required, Validators.min(this.maxUsedRange.min), Validators.max(this.maxUsedRange.max)],
    ],
    special_class_metadata_reserve_pct: [
      TierConfigFormComponent.defaultReservePercent,
      [Validators.required, Validators.min(this.reserveRange.min), Validators.max(this.reserveRange.max)],
    ],
  });

  private initialEnabled = false;

  constructor() {
    super();

    this.form.controls.enabled.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((enabled) => {
      this.showEnabledWarning.set(enabled && !this.initialEnabled);
    });
  }

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('zfs.tier.config'), (config: ZfsTierConfig) => {
      this.initialEnabled = config.enabled;
      this.form.patchValue(config);
    });
  }

  protected handleSubmit = (): SubmitResult => ({
    request$: this.api.call('zfs.tier.update', [this.form.getRawValue()]),
    successMessage: this.translate.instant('Tiering configuration updated.'),
  });
}
