import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './influx-db-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfluxDbServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    host: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    database: ['', Validators.required],
    series_name: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
