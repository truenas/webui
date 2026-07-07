import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-aws-sns-service',
  templateUrl: './aws-sns-service.component.html',
  styleUrls: ['../alert-service-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class AwsSnsServiceComponent extends BaseAlertServiceForm {
  private formBuilder = inject(FormBuilder);

  protected readonly InputType = InputType;

  form = this.formBuilder.group({
    region: ['', Validators.required],
    topic_arn: ['', Validators.required],
    aws_access_key_id: ['', Validators.required],
    aws_secret_access_key: ['', Validators.required],
  });
}
