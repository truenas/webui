import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './mattermost-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MattermostServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    url: ['', Validators.required],
    username: ['', Validators.required],
    channel: [''],
    icon_url: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
