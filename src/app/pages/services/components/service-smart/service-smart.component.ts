import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SmartPowerMode } from 'app/enums/smart-power.mode';
import helptext from 'app/helptext/services/components/service-smart';
import { SmartConfigUpdate } from 'app/interfaces/smart-test.interface';
import { numberValidator } from 'app/modules/entity/entity-form/validators/number-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './service-smart.component.html',
  styleUrls: ['./service-smart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSmartComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    interval: [0, [numberValidator(), Validators.required]],
    powermode: [null as SmartPowerMode, Validators.required],
    difference: [0, [numberValidator(), Validators.required]],
    informational: [0, [numberValidator(), Validators.required]],
    critical: [0, [numberValidator(), Validators.required]],
  });

  readonly tooltips = {
    interval: helptext.smart_interval_tooltip,
    powermode: helptext.smart_powermode_tooltip,
    difference: helptext.smart_difference_tooltip,
    informational: helptext.smart_informational_tooltip,
    critical: helptext.smart_critical_tooltip,
  };

  readonly powermodeOptions$ = of([
    { label: this.translate.instant('Never'), value: SmartPowerMode.Never },
    { label: this.translate.instant('Sleep'), value: SmartPowerMode.Sleep },
    { label: this.translate.instant('Standby'), value: SmartPowerMode.Standby },
    { label: this.translate.instant('Idle'), value: SmartPowerMode.Idle },
  ]);

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
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
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
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
          this.cdr.markForCheck();
          this.router.navigate(['/services']);
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
