import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnInit,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable, of, pairwise, startWith, switchMap,
} from 'rxjs';
import { DirectoryServiceCredentialType, DirectoryServiceType } from 'app/enums/directory-services.enum';
import {
  adAndIpaSupportedCredentialTypes, DirectoryServiceCredential, ldapSupportedCredentialTypes,
} from 'app/interfaces/directoryservice-credentials.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';

@UntilDestroy()
@Component({
  selector: 'ix-credential-config',
  templateUrl: './credential-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class CredentialConfigComponent implements OnInit {
  protected form = this.fb.group({
    credential_type: [null as DirectoryServiceCredentialType],
    principal: [null as string],
    username: [null as string],
    password: [null as string],
    binddn: [null as string],
    bindpw: [null as string],
    client_certificate: [null as string],
  });

  readonly serviceType = input<DirectoryServiceType | null>(null);
  readonly credential = input<DirectoryServiceCredential | null>(null);
  readonly credentialUpdated = output<DirectoryServiceCredential | null>();
  readonly isValid = output<boolean>();

  protected readonly DirectoryServicesCredentialType = DirectoryServiceCredentialType;
  protected readonly credentialType = toSignal<DirectoryServiceCredentialType | null>(
    this.form.controls.credential_type.valueChanges,
  );

  protected readonly credentialTypeOptions$: Observable<Option[]> = toObservable(this.serviceType).pipe(
    switchMap((serviceType) => {
      if (serviceType === DirectoryServiceType.Ldap) {
        return of(ldapSupportedCredentialTypes);
      }
      return of(adAndIpaSupportedCredentialTypes);
    }),
  );

  protected kerberosPrincipals$: Observable<Option[]> = of([] as Option[]);
  protected certificates$: Observable<Option[]> = of([] as Option[]);

  constructor(
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initializeFormWithExistingData();
    this.buildCredentialsFromForm();
  }

  private buildCredentialsFromForm(): void {
    this.form.valueChanges
      .pipe(
        startWith(null),
        pairwise(),
        untilDestroyed(this),
      )
      .subscribe(([prev, current]) => {
        if (prev.credential_type !== current.credential_type) {
          this.updateFormValidators();
        }
        this.isValid.emit(this.form.valid);
        this.credentialUpdated.emit(this.form.value as DirectoryServiceCredential);
      });
  }

  private initializeFormWithExistingData(): void {
    const existingCredential = this.credential();
    if (!existingCredential) {
      return;
    }

    this.form.controls.credential_type.setValue(existingCredential.credential_type);

    switch (existingCredential.credential_type) {
      case DirectoryServiceCredentialType.KerberosUser:
        this.form.patchValue({
          credential_type: DirectoryServiceCredentialType.KerberosUser,
          username: existingCredential.username,
          password: existingCredential.password,
        });
        break;
      case DirectoryServiceCredentialType.KerberosPrincipal:
        this.form.patchValue({
          credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
          principal: existingCredential.principal,
        });
        break;
      case DirectoryServiceCredentialType.LdapPlain:
        this.form.patchValue({
          credential_type: DirectoryServiceCredentialType.LdapPlain,
          binddn: existingCredential.binddn,
          bindpw: existingCredential.bindpw,
        });
        break;
      case DirectoryServiceCredentialType.LdapAnonymous:
        this.form.patchValue({
          credential_type: DirectoryServiceCredentialType.LdapAnonymous,
        });
        break;
      case DirectoryServiceCredentialType.LdapMtls:
        this.form.patchValue({
          credential_type: DirectoryServiceCredentialType.LdapMtls,
          client_certificate: existingCredential.client_certificate,
        });
        break;
    }
  }

  private updateFormValidators(): void {
    const controls = Object.values(this.form.controls);
    for (const control of controls) {
      control.clearValidators();
    }
    switch (this.credentialType()) {
      case DirectoryServiceCredentialType.KerberosPrincipal:
        this.form.controls.principal.addValidators([Validators.required]);
        break;
      case DirectoryServiceCredentialType.KerberosUser:
        this.form.controls.username.addValidators([Validators.required]);
        this.form.controls.password.addValidators([Validators.required]);
        break;
      case DirectoryServiceCredentialType.LdapAnonymous:
        break;
      case DirectoryServiceCredentialType.LdapMtls:
        this.form.controls.client_certificate.addValidators([Validators.required]);
        break;
      case DirectoryServiceCredentialType.LdapPlain:
        this.form.controls.binddn.addValidators([Validators.required]);
        this.form.controls.bindpw.addValidators([Validators.required]);
        break;
    }
    for (const control of controls) {
      control.updateValueAndValidity({ emitEvent: false });
    }
    this.form.updateValueAndValidity({ emitEvent: false });
  }
}
