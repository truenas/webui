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
  map,
  Observable, of, pairwise, startWith, switchMap,
} from 'rxjs';
import { DirectoryServiceCredentialType, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import {
  adAndIpaSupportedCredentialTypes,
  DirectoryServiceCredential,
  KerberosCredentialPrincipal,
  KerberosCredentialUser,
  LdapCredentialAnonymous,
  LdapCredentialMutualTls,
  LdapCredentialPlain,
  ldapSupportedCredentialTypes,
} from 'app/interfaces/directoryservice-credentials.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-credential-config',
  templateUrl: './credential-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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

  readonly serviceType = input.required<DirectoryServiceType | null>();
  readonly credential = input.required<DirectoryServiceCredential | null>();
  readonly credentialUpdated = output<DirectoryServiceCredential | null>();
  readonly isValid = output<boolean>();

  protected readonly DirectoryServicesCredentialType = DirectoryServiceCredentialType;
  protected readonly credentialType = toSignal<DirectoryServiceCredentialType | null>(
    this.form.controls.credential_type.valueChanges,
  );

  protected readonly clientCertsOptions$ = this.api.call('directoryservices.certificate_choices').pipe(
    choicesToOptions(),
  );

  protected readonly credentialTypeOptions$: Observable<Option[]> = toObservable(this.serviceType).pipe(
    switchMap((serviceType) => {
      if (serviceType === DirectoryServiceType.Ldap) {
        return of(ldapSupportedCredentialTypes);
      }
      return of(adAndIpaSupportedCredentialTypes);
    }),
  );

  protected kerberosPrincipals$: Observable<Option[]> = this.api.call(
    'kerberos.keytab.kerberos_principal_choices',
  ).pipe(
    map((choices) => choices.map((choice) => ({ label: choice, value: choice } as Option))),
  );

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
  ) {

  }

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
        if (prev?.credential_type !== current.credential_type) {
          this.updateFormValidators();
        }
        this.isValid.emit(this.form.valid);
        if (current.credential_type === DirectoryServiceCredentialType.KerberosUser) {
          const userCred: KerberosCredentialUser = {
            credential_type: DirectoryServiceCredentialType.KerberosUser,
            password: current.password,
            username: current.username,
          };
          this.credentialUpdated.emit(userCred);
        }

        if (current.credential_type === DirectoryServiceCredentialType.KerberosPrincipal) {
          const principalCred: KerberosCredentialPrincipal = {
            credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
            principal: current.principal,
          };
          this.credentialUpdated.emit(principalCred);
        }

        if (current.credential_type === DirectoryServiceCredentialType.LdapAnonymous) {
          const anonCred: LdapCredentialAnonymous = {
            credential_type: DirectoryServiceCredentialType.LdapAnonymous,
          };
          this.credentialUpdated.emit(anonCred);
        }

        if (current.credential_type === DirectoryServiceCredentialType.LdapMtls) {
          const ldapMtlsCred: LdapCredentialMutualTls = {
            credential_type: DirectoryServiceCredentialType.LdapMtls,
            client_certificate: current.client_certificate,
          };
          this.credentialUpdated.emit(ldapMtlsCred);
        }

        if (current.credential_type === DirectoryServiceCredentialType.LdapPlain) {
          const ldapPlainCred: LdapCredentialPlain = {
            credential_type: DirectoryServiceCredentialType.LdapPlain,
            binddn: current.binddn,
            bindpw: current.bindpw,
          };
          this.credentialUpdated.emit(ldapPlainCred);
        }
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
