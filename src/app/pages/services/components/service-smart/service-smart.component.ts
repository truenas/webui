import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import helptext from 'app/helptext/services/components/service-smart';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { SmartPowerMode } from '../../../../enums/smart-power.mode';
import { EntityUtils } from '../../../common/entity/utils';

@UntilDestroy()
@Component({
  templateUrl: './service-smart.component.html',
  styleUrls: ['./service-smart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSmartComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    interval: [0, Validators.required],
    powermode: [null as SmartPowerMode, Validators.required],
    difference: [0, Validators.required],
    informational: [0, Validators.required],
    critical: [0, Validators.required],
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
      .subscribe(
        (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
        },
        (error) => {
          new EntityUtils().handleWSError(null, error, this.dialogService);
          this.isFormLoading = false;
        },
      );
  }

  onSubmit(): void {
    const values = this.form.value;

    // Converting to numbers is only necessary for unit tests,
    // which don't play nicely with numbers in inputs.
    const params = {
      interval: Number(values.interval),
      powermode: values.powermode,
      difference: Number(values.difference),
      informational: Number(values.informational),
      critical: Number(values.critical),
    };

    this.isFormLoading = true;
    this.ws.call('smart.update', [params])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isFormLoading = false;
          this.router.navigate(['/services']);
        },
        (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      );
  }
}
