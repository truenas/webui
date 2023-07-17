import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  templateUrl: './telegram-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelegramServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    bot_token: ['', Validators.required],
    chat_ids: [[] as number[], [
      Validators.required,
      this.validatorsService.customValidator(
        (control) => this.validateTelegramChatIds(control),
        this.translate.instant('Only numeric ids are allowed.'),
      ),
    ]],
  });

  constructor(
    private formBuilder: FormBuilder,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
  ) {
    super();
  }

  getSubmitAttributes(): TelegramServiceComponent['form']['value'] {
    return {
      ...this.form.value,
      chat_ids: this.form.value.chat_ids.map((chatId) => Number(chatId)),
    };
  }

  validateTelegramChatIds(control: AbstractControl): boolean {
    const chatIds = control.value as string[];
    return chatIds.every((chatId) => String(chatId).match(/^-?\d*$/));
  }
}
