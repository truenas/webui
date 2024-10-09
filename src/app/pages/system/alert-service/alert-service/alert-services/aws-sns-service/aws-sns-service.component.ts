import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-aws-sns-service',
  templateUrl: './aws-sns-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    TranslateModule,
  ],
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
