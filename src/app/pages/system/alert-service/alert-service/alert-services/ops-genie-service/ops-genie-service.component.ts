import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-ops-genie-service',
  templateUrl: './ops-genie-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    TranslateModule,
  ],
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
