import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './email-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    email: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
