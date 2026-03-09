import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
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
    TranslateModule,
    WarningComponent,
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

  protected readonly enabledWarning = T('Enabling tiering changes share behavior. SMB shares and Webshares will no longer export sub-datasets.');

  formGroup = this.fb.nonNullable.group({
    enabled: [false],
    max_concurrent_jobs: [1],
    min_available_space: [0],
  });

  private initialEnabled = false;

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.formGroup.dirty);
    });

    this.formGroup.controls.enabled.valueChanges.pipe(
      takeUntilDestroyed(),
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
