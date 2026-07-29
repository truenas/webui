import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-ops-genie-service',
  templateUrl: './ops-genie-service.component.html',
  styleUrls: ['../alert-service-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class OpsGenieServiceComponent extends BaseAlertServiceForm {
  private formBuilder = inject(FormBuilder);

  form = this.formBuilder.group({
    api_key: ['', Validators.required],
    api_url: [''],
  });
}
