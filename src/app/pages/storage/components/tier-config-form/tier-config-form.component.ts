import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { poolLowCapacityPercent } from 'app/constants/pool-capacity.constant';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-tier-config-form',
  templateUrl: './tier-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TnBannerComponent,
    TranslateModule,
  ],
})
export class TierConfigFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private globalErrorHandler = inject(ErrorHandlerService);
  slideInRef = inject<SlideInRef<void, boolean>>(SlideInRef);
  private destroyRef = inject(DestroyRef);

  isFormLoading = signal(false);
  showEnabledWarning = signal(false);

  protected readonly enabledWarningHeading = T('Shares will be locked to a single dataset');
  protected readonly enabledWarningMessage = T('Once tiering is on, SMB shares and Webshares stop following nested datasets. Each share will expose only its own dataset, and any child datasets under it will no longer be visible to clients through that share. Create a separate share for each dataset you want to expose.');

  protected readonly helptext = {
    maxConcurrentJobs: T('Maximum number of tiering rewrite jobs that can run in parallel. Higher values speed up data movement between tiers but increase CPU and I/O load on the system.'),
    maxUsedPercentage: T('Pool capacity threshold (in percent) above which tiering will move data off the performance tier to keep free space available. Lower values reserve more free space; higher values let the performance tier fill more before data is migrated.'),
  };

  private static readonly defaultMaxConcurrentJobs = 1;

  formGroup = this.fb.nonNullable.group({
    enabled: [false],
    max_concurrent_jobs: [
      TierConfigFormComponent.defaultMaxConcurrentJobs,
      [Validators.required, Validators.min(1)],
    ],
    max_used_percentage: [
      poolLowCapacityPercent,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
  });

  private initialEnabled = false;

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.formGroup.dirty);
    });

    this.formGroup.controls.enabled.valueChanges.pipe(
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
        this.formGroup.patchValue(config);
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.globalErrorHandler.showErrorModal(error);
      },
    });
  }

  protected submit(): void {
    if (this.isFormLoading()) return;
    const values = this.formGroup.getRawValue();
    this.isFormLoading.set(true);

    this.api.call('zfs.tier.update', [values]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.formGroup);
      },
    });
  }
}
