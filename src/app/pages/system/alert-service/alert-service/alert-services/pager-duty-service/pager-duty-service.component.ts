import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './pager-duty-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagerDutyServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    service_key: ['', Validators.required],
    client_name: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
