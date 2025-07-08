import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  input,
  output,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

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
    IxIconComponent,
    TranslateModule,
  ],
})
export class CredentialConfigComponent implements OnInit {
  readonly configurationType = input<string | null>(null);
  readonly credentialData = input<DirectoryServicesUpdate['credential']>(null);
  readonly credentialDataChanged = output<DirectoryServicesUpdate['credential']>();

  form = this.fb.group({
    credential_interface_type: [null],
    credential_type: [null],
    // Kerberos Principal credential
    principal: [null],
    // Kerberos User credential
    username: [null],
    password: [null],
    // LDAP Plain credential
    binddn: [null],
    bindpw: [null],
    // LDAP Mutual TLS credential
    client_certificate: [null],
  });

  credentialTypeOptions$: Observable<Option[]> = of([
    { label: 'Kerberos Credential Principal', value: 'KerberosCredentialPrincipal' },
    { label: 'Kerberos Credential User', value: 'KerberosCredentialUser' },
    { label: 'LDAP Credential Plain', value: 'LdapCredentialPlain' },
    { label: 'LDAP Credential Anonymous', value: 'LdapCredentialAnonymous' },
    { label: 'LDAP Credential Mutual TLS', value: 'LdapCredentialMutualTls' },
  ] as Option[]);

  kerberosPrincipals$: Observable<Option[]> = of([] as Option[]);
  certificates$: Observable<Option[]> = of([] as Option[]);

  selectedCredentialInterfaceType = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Initialize form with existing credential data if available
    this.initializeFormWithExistingData();

    // Initialize signal with current form value
    this.selectedCredentialInterfaceType.set(this.form.controls.credential_interface_type.value as string | null);

    // Watch for credential interface type changes
    this.form.controls.credential_interface_type.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((credentialInterfaceType) => {
        this.selectedCredentialInterfaceType.set(credentialInterfaceType as string | null);
        this.updateCredentialFields(credentialInterfaceType as string | null);
        this.cdr.markForCheck();
      });

    // Watch for any form changes and emit refined credential object
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.credentialDataChanged.emit(this.buildCredentialObject());
      });
  }

  private initializeFormWithExistingData(): void {
    const existingCredential = this.credentialData();
    if (!existingCredential) {
      return;
    }

    // Set the credential_type field
    this.form.controls.credential_type.setValue(existingCredential.credential_type, { emitEvent: false });

    // Map credential type to interface type and populate form fields
    switch (existingCredential.credential_type) {
      case DirectoryServiceCredentialType.KerberosUser: {
        const kerberosUser = existingCredential as { credential_type: string; username: string; password: string };
        this.form.patchValue({
          credential_interface_type: 'KerberosCredentialUser',
          username: kerberosUser.username,
          password: kerberosUser.password,
        }, { emitEvent: false });
        break;
      }
      case DirectoryServiceCredentialType.KerberosPrincipal: {
        const kerberosPrincipal = existingCredential as { credential_type: string; principal: string };
        this.form.patchValue({
          credential_interface_type: 'KerberosCredentialPrincipal',
          principal: kerberosPrincipal.principal,
        }, { emitEvent: false });
        break;
      }
      case DirectoryServiceCredentialType.LdapPlain: {
        const ldapPlain = existingCredential as { credential_type: string; binddn: string; bindpw: string };
        this.form.patchValue({
          credential_interface_type: 'LdapCredentialPlain',
          binddn: ldapPlain.binddn,
          bindpw: ldapPlain.bindpw,
        }, { emitEvent: false });
        break;
      }
      case DirectoryServiceCredentialType.LdapAnonymous:
        this.form.patchValue({
          credential_interface_type: 'LdapCredentialAnonymous',
        }, { emitEvent: false });
        break;
      case DirectoryServiceCredentialType.LdapMtls: {
        const ldapMtls = existingCredential as { credential_type: string; client_certificate: string };
        this.form.patchValue({
          credential_interface_type: 'LdapCredentialMutualTls',
          client_certificate: ldapMtls.client_certificate,
        }, { emitEvent: false });
        break;
      }
    }
  }

  private updateCredentialFields(credentialInterfaceType: string | null): void {
    // Clear all validators
    this.clearAllValidators();

    if (!credentialInterfaceType) {
      this.form.controls.credential_type.setValue(null, { emitEvent: false });
      return;
    }

    // Map interface type to backend credential type strings and set validators
    let credentialType: string | null = null;

    switch (credentialInterfaceType) {
      case 'KerberosCredentialUser':
        credentialType = DirectoryServiceCredentialType.KerberosUser as string;
        this.form.controls.username.setValidators([Validators.required]);
        this.form.controls.password.setValidators([Validators.required]);
        break;
      case 'KerberosCredentialPrincipal':
        credentialType = DirectoryServiceCredentialType.KerberosPrincipal as string;
        this.form.controls.principal.setValidators([Validators.required]);
        break;
      case 'LdapCredentialPlain':
        credentialType = DirectoryServiceCredentialType.LdapPlain as string;
        this.form.controls.binddn.setValidators([Validators.required]);
        this.form.controls.bindpw.setValidators([Validators.required]);
        break;
      case 'LdapCredentialAnonymous':
        credentialType = DirectoryServiceCredentialType.LdapAnonymous as string;
        // No additional fields required for anonymous
        break;
      case 'LdapCredentialMutualTls':
        credentialType = DirectoryServiceCredentialType.LdapMtls as string;
        this.form.controls.client_certificate.setValidators([Validators.required]);
        break;
    }

    // Set the actual credential_type field for backend compatibility
    this.form.controls.credential_type.setValue(credentialType, { emitEvent: false });

    // Update form control validity
    this.updateFormControlValidity();

    // Emit the updated credential object
    this.credentialDataChanged.emit(this.buildCredentialObject());
  }

  private buildCredentialObject(): DirectoryServicesUpdate['credential'] {
    const formValue = this.form.value;

    if (!formValue.credential_type) {
      return null;
    }

    switch (formValue.credential_type) {
      case DirectoryServiceCredentialType.KerberosUser:
        if (!formValue.username || !formValue.password) {
          return null;
        }
        return {
          credential_type: DirectoryServiceCredentialType.KerberosUser,
          username: formValue.username as string,
          password: formValue.password as string,
        };
      case DirectoryServiceCredentialType.KerberosPrincipal:
        if (!formValue.principal) {
          return null;
        }
        return {
          credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
          principal: formValue.principal as string,
        };
      case DirectoryServiceCredentialType.LdapPlain:
        if (!formValue.binddn || !formValue.bindpw) {
          return null;
        }
        return {
          credential_type: DirectoryServiceCredentialType.LdapPlain,
          binddn: formValue.binddn as string,
          bindpw: formValue.bindpw as string,
        };
      case DirectoryServiceCredentialType.LdapAnonymous:
        return {
          credential_type: DirectoryServiceCredentialType.LdapAnonymous,
        };
      case DirectoryServiceCredentialType.LdapMtls:
        if (!formValue.client_certificate) {
          return null;
        }
        return {
          credential_type: DirectoryServiceCredentialType.LdapMtls,
          client_certificate: formValue.client_certificate as string,
        };
      default:
        return null;
    }
  }

  private clearAllValidators(): void {
    this.form.controls.principal.clearValidators();
    this.form.controls.username.clearValidators();
    this.form.controls.password.clearValidators();
    this.form.controls.binddn.clearValidators();
    this.form.controls.bindpw.clearValidators();
    this.form.controls.client_certificate.clearValidators();
  }

  private updateFormControlValidity(): void {
    this.form.controls.principal.updateValueAndValidity();
    this.form.controls.username.updateValueAndValidity();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.binddn.updateValueAndValidity();
    this.form.controls.bindpw.updateValueAndValidity();
    this.form.controls.client_certificate.updateValueAndValidity();
  }
}
