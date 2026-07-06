import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-influx-db-service',
  templateUrl: './influx-db-service.component.html',
  styleUrls: ['../alert-service-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class InfluxDbServiceComponent extends BaseAlertServiceForm {
  private formBuilder = inject(FormBuilder);

  protected readonly InputType = InputType;

  form = this.formBuilder.group({
    host: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    database: ['', Validators.required],
    series_name: ['', Validators.required],
  });
}
