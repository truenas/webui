import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {RestService} from "../../../../services/rest.service";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import {MatSnackBar} from "@angular/material";
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChangePasswordComponent {

  protected resource_name = 'account/users/1/password/';
  protected route_success: string[] = ['sessions', 'signin'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'bsdusr_username',
      placeholder : 'Username',
    },
    {
      type : 'input',
      name : 'bsdusr_passwd_currnt',
      placeholder : 'Current Password',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'bsdusr_password',
      placeholder : 'New Password',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'bsdusr_password_conf',
      placeholder : 'Confirm Password',
      inputType : 'password',
      validation : [ matchOtherValidator('bsdusr_password') ]
    },
  ];

  constructor(protected rest: RestService, protected router: Router,
              protected loader: AppLoaderService,
              public snackBar: MatSnackBar) {
  }

}
