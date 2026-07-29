import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnInputComponent } from '@truenas/ui-components';
import { AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-mattermost-service',
  templateUrl: './mattermost-service.component.html',
  styleUrls: ['../alert-service-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
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

  // tn-input has no `[parse]` equivalent, so the URL normalization previously
  // done by `formatter.stringAsUrlParsing` on the controls runs here at submit.
  // Only normalize non-empty values — an empty optional field must stay empty
  // rather than becoming a bare `http://` (matching the old per-control parse,
  // which only ran on values the user actually entered).
  override getSubmitAttributes(): AlertServiceEdit['attributes'] {
    const values = this.form.value;
    return {
      url: this.formatter.stringAsUrlParsing(values.url ?? ''),
      username: values.username ?? '',
      channel: values.channel ?? '',
      icon_url: values.icon_url ? this.formatter.stringAsUrlParsing(values.icon_url) : '',
    };
  }
}
