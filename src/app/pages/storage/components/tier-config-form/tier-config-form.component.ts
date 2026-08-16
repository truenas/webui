import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnBannerComponent, TnCheckboxComponent,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-tier-config-form',
  templateUrl: './tier-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnInputComponent,
    TnBannerComponent,
    TranslateModule,
  ],
})
export class TierConfigFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private globalErrorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  protected showEnabledWarning = signal(false);

  protected readonly enabledWarningHeading = T('Shares will be locked to a single dataset');
  protected readonly enabledWarningMessage = T('Once tiering is on, SMB shares and Webshares stop following nested datasets. Each share will expose only its own dataset, and any child datasets under it will no longer be visible to clients through that share. Create a separate share for each dataset you want to expose.');

  protected readonly helptext = {
    maxConcurrentJobs: T('Maximum number of tiering jobs that can run at the same time ({min}–{max}). Higher values speed up data movement between tiers but increase CPU and I/O load on the system.'),
    maxUsedPercentage: T('Stop moving data between tiers when the pool reaches this percentage full ({min}–{max}). This keeps tiering from using up the last of the pool\'s free space.'),
    performanceTierReserve: T('Percentage of the performance tier kept in reserve ({min}–{max}). When only this much space is left on the performance tier, new data goes to the regular tier instead. Shown as reserved space on the pool Usage card.'),
  };

  // Bounds mirror the zfs.tier.update API schema and are interpolated into the field hints.
  protected readonly concurrentJobsRange = { min: 1, max: 10 };
  protected readonly maxUsedRange = { min: 70, max: 95 };
  protected readonly reserveRange = { min: 10, max: 30 };

  private static readonly defaultMaxConcurrentJobs = 1;
  private static readonly defaultMaxUsedPercent = 80;
  private static readonly defaultReservePercent = 25;

  readonly form = this.fb.nonNullable.group({
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

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

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
    this.isFormLoading.set(true);
    this.api.call('zfs.tier.config').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (config: ZfsTierConfig) => {
        this.initialEnabled = config.enabled;
        this.form.patchValue(config);
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.globalErrorHandler.showErrorModal(error);
      },
    });
  }

  protected onSubmit(): void {
    if (this.isFormLoading()) return;
    const values = this.form.getRawValue();
    this.isFormLoading.set(true);

    this.api.call('zfs.tier.update', [values]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
