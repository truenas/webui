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
  slideInRef = inject<SlideInRef<void, boolean>>(SlideInRef);
  private destroyRef = inject(DestroyRef);

  isFormLoading = signal(false);
  showEnabledWarning = signal(false);

  protected readonly enabledWarningHeading = T('Shares will be locked to a single dataset');
  protected readonly enabledWarningMessage = T('Once tiering is on, SMB shares and Webshares stop following nested datasets. Each share will expose only its own dataset, and any child datasets under it will no longer be visible to clients through that share. Create a separate share for each dataset you want to expose.');

  private static readonly defaultMaxConcurrentJobs = 1;
  private static readonly defaultMaxUsedPercentage = 80;

  formGroup = this.fb.nonNullable.group({
    enabled: [false],
    max_concurrent_jobs: [
      TierConfigFormComponent.defaultMaxConcurrentJobs,
      [Validators.required, Validators.min(1)],
    ],
    max_used_percentage: [
      TierConfigFormComponent.defaultMaxUsedPercentage,
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
        this.initialEnabled = config.enabled ?? false;
        this.formGroup.patchValue({
          enabled: config.enabled ?? false,
          max_concurrent_jobs: config.max_concurrent_jobs ?? TierConfigFormComponent.defaultMaxConcurrentJobs,
          max_used_percentage: config.max_used_percentage ?? TierConfigFormComponent.defaultMaxUsedPercentage,
        });
        this.isFormLoading.set(false);
      },
      error: () => {
        this.isFormLoading.set(false);
      },
    });
  }

  protected submit(): void {
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
