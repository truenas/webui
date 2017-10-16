import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {RestService} from "../../../../services/rest.service";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import {MdSnackBar} from "@angular/material";
import {EntityUtils} from "../../../common/entity/utils";


@Component({
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  passwordFormGroup: FormGroup;

  constructor(private formBuilder: FormBuilder, protected rest: RestService, protected router: Router,
              protected loader: AppLoaderService,
              public snackBar: MdSnackBar) {
  }

  ngOnInit() {
    this.buildPasswordForm();
  }

  buildPasswordForm(): void {
    this.passwordFormGroup = this.formBuilder.group({
      bsdusr_username: ['', Validators.required],
      bsdusr_currpassword: ['', Validators.required],
      bsdusr_password: ['', Validators.required],
      bsdusr_confirmpasswd: ['', Validators.required]
    })
  }

  changePassword(body): void {
    const changepasswd$ = this.rest.post(`account/users/1/password/`, {body}, true);
    this.loader.open();
    changepasswd$.subscribe((res) => {
      this.router.navigateByUrl('/account/users/edit/1');
      this.loader.open();
      this.snackBar.open("Password changed successfully.", 'close', { duration: 3000 })
    }, (err) => {
      this.loader.close();
      new EntityUtils().handleError(this, err);
    });
  }
}
