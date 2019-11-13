import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {RestService} from "../../../../services/rest.service";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import {MatSnackBar} from "@angular/material";
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/account/user-change-pw';

@Component({
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChangePasswordComponent {

  protected resource_name = 'account/users/1/password/';
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : helptext.pw_username_name,
      placeholder : helptext.pw_username_placeholder,
    },
    {
      type : 'input',
      name : helptext.pw_current_pw_name,
      placeholder : helptext.pw_current_pw_placeholder,
      inputType : 'password',
      togglePw: true,
    },
    {
      type : 'input',
      name : helptext.pw_new_pw_name,
      placeholder : helptext.pw_new_pw_placeholder,
      inputType : 'password',
      tooltip: helptext.pw_new_pw_tooltip
    },
    {
      type : 'input',
      name : helptext.pw_confirm_pw_name,
      placeholder : helptext.pw_confirm_pw_placeholder,
      inputType : 'password',
      validation : helptext.pw_confirm_pw_validation
    },
  ];

  constructor(protected rest: RestService, protected router: Router,
              protected loader: AppLoaderService,
              public snackBar: MatSnackBar) {
  }

}
