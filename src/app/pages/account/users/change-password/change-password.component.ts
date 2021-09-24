import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import helptext from 'app/helptext/account/user-change-pw';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
@Component({
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ChangePasswordComponent implements FormConfiguration {
  // protected resource_name = 'account/users/1/password/';
  isEntity = true;
  protected entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.pw_form_title_name,
      class: helptext.pw_form_title_class,
      label: true,
      config: [
        {
          type: 'input',
          name: 'curr_password',
          placeholder: helptext.pw_current_pw_placeholder,
          inputType: 'password',
          required: true,
          togglePw: true,
        },
        {
          type: 'input',
          name: 'password',
          placeholder: helptext.pw_new_pw_placeholder,
          inputType: 'password',
          required: true,
          tooltip: helptext.pw_new_pw_tooltip,
        },
        {
          type: 'input',
          name: 'password_conf',
          placeholder: helptext.pw_confirm_pw_placeholder,
          inputType: 'password',
          required: true,
          validation: helptext.pw_confirm_pw_validation,
        },
      ],
    }];

  constructor(protected ws: WebSocketService, protected router: Router,
    protected loader: AppLoaderService, protected dialog: DialogService) {
  }

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
  }

  customSubmit(body: any): Subscription {
    delete body.password_conf;
    this.loader.open();
    return this.ws.call('auth.check_user', ['root', body.curr_password]).pipe(untilDestroyed(this)).subscribe((check) => {
      if (check) {
        delete body.curr_password;
        this.ws.call('user.update', [1, body]).pipe(untilDestroyed(this)).subscribe(() => {
          this.loader.close();
          this.entityForm.success = true;
          this.entityForm.successMessage = helptext.pw_updated;
          this.entityForm.formGroup.markAsPristine();
        }, (res) => {
          this.loader.close();
          new EntityUtils().handleWSError(this.entityForm, res);
        });
      } else {
        this.loader.close();
        this.dialog.info(helptext.pw_invalid_title, helptext.pw_invalid_msg, '300px', 'warning', true);
      }
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
