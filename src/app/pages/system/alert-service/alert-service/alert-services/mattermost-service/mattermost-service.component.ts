import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-mattermost-service',
  templateUrl: './mattermost-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    TranslateModule,
  ],
})
export class MattermostServiceComponent extends BaseAlertServiceForm {
  private formBuilder = inject(FormBuilder);
  formatter = inject(IxFormatterService);

  form = this.formBuilder.group({
    url: ['', Validators.required],
    username: ['', Validators.required],
    channel: [''],
    icon_url: [''],
  });
}
