import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl, Validators, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnChipInputComponent, TnFormFieldComponent, TnInputComponent } from '@truenas/ui-components';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

@Component({
  selector: 'ix-telegram-service',
  templateUrl: './telegram-service.component.html',
  styleUrls: ['../alert-service-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnChipInputComponent,
    TranslateModule,
  ],
})
export class TelegramServiceComponent extends BaseAlertServiceForm {
  private formBuilder = inject(NonNullableFormBuilder);
  private validatorsService = inject(IxValidatorsService);
  private translate = inject(TranslateService);

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

  override getSubmitAttributes(): TelegramServiceComponent['form']['value'] {
    return {
      ...this.form.getRawValue(),
      chat_ids: this.form.getRawValue().chat_ids.map((chatId) => Number(chatId)),
    };
  }

  private validateTelegramChatIds(control: AbstractControl): boolean {
    const chatIds = control.value as string[];
    return chatIds.every((chatId) => /^-?\d*$/.exec(String(chatId)));
  }
}
