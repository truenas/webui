import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {WebSocketService, DialogService} from "../../../../services/";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import {MatSnackBar} from "@angular/material";
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/account/user-change-pw';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';

@Component({
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChangePasswordComponent {

  //protected resource_name = 'account/users/1/password/';
  protected isEntity: boolean = true;
  protected entityForm: any;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.pw_form_title_name,
      class: helptext.pw_form_title_class,
      label:true,
      config:[
      {
        type : 'input',
        name : 'curr_password',
        placeholder : helptext.pw_current_pw_placeholder,
        inputType : 'password',
        required: true,
        togglePw: true,
      },
      {
        type : 'input',
        name : 'password',
        placeholder : helptext.pw_new_pw_placeholder,
        inputType : 'password',
        required: true,
        tooltip: helptext.pw_new_pw_tooltip
      },
      {
        type : 'input',
        name : 'password_conf',
        placeholder : helptext.pw_confirm_pw_placeholder,
        inputType : 'password',
        required: true,
        validation : helptext.pw_confirm_pw_validation
      },
    ]
  }]

  constructor(protected ws: WebSocketService, protected router: Router,
              protected loader: AppLoaderService, protected dialog: DialogService,
              public snackBar: MatSnackBar) {
  }

  preInit(entityForm) {
    this.entityForm = entityForm;
  }

  public customSubmit(body) {
    delete body.password_conf;
    this.loader.open();
    return this.ws.call('auth.check_user', ['root', body.curr_password]).subscribe((check) => {
      if (check) {
        delete body.curr_password;
        this.ws.call('user.update', [1, body]).subscribe((res) => {
          this.loader.close();
          this.dialog.Info(helptext.pw_updated_title, '', '300px', 'info', true);
        }, (res) => {
          this.loader.close();
          new EntityUtils().handleWSError(this.entityForm, res);
        });
      } else {
        this.loader.close();
        this.dialog.Info(helptext.pw_invalid_title, helptext.pw_invalid_msg, '300px', 'warning', true);
      }
    }, (res) => {
       this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

}
