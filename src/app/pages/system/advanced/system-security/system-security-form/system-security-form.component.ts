import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-form',
  templateUrl: './system-security-form.component.html',
  styleUrls: ['./system-security-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSecurityFormComponent implements OnInit {
  form = this.formBuilder.group({
    enable_fips: [false],
  });

  isLoading = false;

  constructor(
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<SystemSecurityFormComponent>,
    @Inject(SLIDE_IN_DATA) private systemSecurityConfig: SystemSecurityConfig,
  ) {}

  ngOnInit(): void {
    if (this.systemSecurityConfig) {
      this.initSystemSecurityForm();
    }
  }

  onSubmit(): void {
    this.isLoading = true;

    this.ws.call('system.security.update', [this.form.value as SystemSecurityConfig])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
          this.slideInRef.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private initSystemSecurityForm(): void {
    this.form.patchValue(this.systemSecurityConfig);
    this.cdr.markForCheck();
  }
}
