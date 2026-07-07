import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnInputComponent } from '@truenas/ui-components';
import { AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  BaseAlertServiceForm,
} from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-slack-service',
  templateUrl: './slack-service.component.html',
  styleUrls: ['../alert-service-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class SlackServiceComponent extends BaseAlertServiceForm {
  private formBuilder = inject(FormBuilder);
  formatter = inject(IxFormatterService);

  form = this.formBuilder.group({
    url: ['', Validators.required],
  });

  // tn-input has no `[parse]` equivalent, so the URL normalization previously
  // done by `formatter.stringAsUrlParsing` on the control runs here at submit.
  override getSubmitAttributes(): AlertServiceEdit['attributes'] {
    return {
      url: this.formatter.stringAsUrlParsing(this.form.value.url ?? ''),
    };
  }
}
