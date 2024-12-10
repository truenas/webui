import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-telegram-service',
  templateUrl: './telegram-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxChipsComponent,
    TranslateModule,
  ],
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

  override getSubmitAttributes(): TelegramServiceComponent['form']['value'] {
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
