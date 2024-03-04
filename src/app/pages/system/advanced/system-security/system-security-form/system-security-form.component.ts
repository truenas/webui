import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
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
  protected requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    enable_fips: [false],
  });

  isLoading = false;

  private systemSecurityConfig: SystemSecurityConfig;

  constructor(
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private router: Router,
    private chainedRef: ChainedRef<SystemSecurityConfig>,
  ) {
    this.systemSecurityConfig = this.chainedRef.getData();
  }

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
          this.promptReboot();
          this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
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

  private promptReboot(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Restart'),
      message: this.translate.instant('Restart is recommended for new FIPS setting to take effect. Would you like to restart now?“'),
      buttonText: this.translate.instant('Restart'),
    }).pipe(
      untilDestroyed(this),
    ).subscribe((approved) => {
      if (approved) {
        this.router.navigate(['/others/reboot'], { skipLocationChange: true });
      }
      this.chainedRef.close({ response: true, error: null });
    });
  }
}
