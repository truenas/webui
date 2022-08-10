import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './ops-genie-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsGenieServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    api_key: ['', Validators.required],
    api_url: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
