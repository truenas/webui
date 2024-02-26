import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SmartPowerMode } from 'app/enums/smart-power.mode';
import { helptextServiceSmart } from 'app/helptext/services/components/service-smart';
import { SmartConfigUpdate } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './service-smart.component.html',
  styleUrls: ['./service-smart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSmartComponent implements OnInit {
  protected requiredRoles = [Role.FullAdmin];

  isFormLoading = false;

  form = this.fb.group({
    interval: [0, [Validators.required]],
    powermode: [null as SmartPowerMode, Validators.required],
    difference: [0, [Validators.required]],
    informational: [0, [Validators.required]],
    critical: [0, [Validators.required]],
  });

  readonly tooltips = {
    interval: helptextServiceSmart.smart_interval_tooltip,
    powermode: helptextServiceSmart.smart_powermode_tooltip,
    difference: helptextServiceSmart.smart_difference_tooltip,
    informational: helptextServiceSmart.smart_informational_tooltip,
    critical: helptextServiceSmart.smart_critical_tooltip,
  };

  readonly powermodeOptions$ = of([
    { label: this.translate.instant('Never'), value: SmartPowerMode.Never },
    { label: this.translate.instant('Sleep'), value: SmartPowerMode.Sleep },
    { label: this.translate.instant('Standby'), value: SmartPowerMode.Standby },
    { label: this.translate.instant('Idle'), value: SmartPowerMode.Idle },
  ]);

  constructor(
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<ServiceSmartComponent>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('smart.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('smart.update', [values as SmartConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close();
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
