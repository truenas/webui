import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './victor-ops-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VictorOpsServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    api_key: ['', Validators.required],
    routing_key: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
