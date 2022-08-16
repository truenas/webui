import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './aws-sns-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsSnsServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    region: ['', Validators.required],
    topic_arn: ['', Validators.required],
    aws_access_key_id: ['', Validators.required],
    aws_secret_access_key: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
