import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {RestService} from "../../../../services/rest.service";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import {MatSnackBar} from "@angular/material";
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';

@Component({
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChangePasswordComponent {

  protected resource_name = 'account/users/1/password/';
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'bsdusr_username',
      placeholder : T('Username'),
    },
    {
      type : 'input',
      name : 'bsdusr_passwd_currnt',
      placeholder : T('Current Password'),
      inputType : 'password',
      togglePw: true,
    },
    {
      type : 'input',
      name : 'bsdusr_password',
      placeholder : T('New Password'),
      inputType : 'password',
      tooltip : T('Passwords cannot contain a <b>?</b>. Passwords should\
       be at least eight characters and contain a mix of lower and\
       upper case, numbers, and special characters.')
    },
    {
      type : 'input',
      name : 'bsdusr_password_conf',
      placeholder : T('Confirm Password'),
      inputType : 'password',
      validation : [ matchOtherValidator('bsdusr_password') ]
    },
  ];

  constructor(protected rest: RestService, protected router: Router,
              protected loader: AppLoaderService,
              public snackBar: MatSnackBar) {
  }

}
