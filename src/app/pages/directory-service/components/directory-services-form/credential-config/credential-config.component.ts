import { ChangeDetectionStrategy, Component, input, output, OnInit, inject } from '@angular/core';
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
  ldapSupportedCredentialTypes,
} from 'app/interfaces/directoryservice-credentials.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DirectoryServiceValidationService } from 'app/pages/directory-service/components/directory-services-form/services/directory-service-validation.service';

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
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private validationService = inject(DirectoryServiceValidationService);

  protected form = this.fb.group({
    credential_type: [null as DirectoryServiceCredentialType, Validators.required],
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

  ngOnInit(): void {
    this.initializeFormWithExistingData();
    this.buildCredentialsFromForm();

    // Emit current credential data immediately if form has valid data
    this.emitCurrentCredentialData();
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
        if (current.credential_type) {
          this.emitCredentialByType(current);
        }
      });
  }

  private initializeFormWithExistingData(): void {
    const existingCredential = this.credential();
    if (!existingCredential) {
      // Set default credential type to Kerberos User for Active Directory
      if (this.serviceType() === DirectoryServiceType.ActiveDirectory) {
        this.form.controls.credential_type.setValue(DirectoryServiceCredentialType.KerberosUser);
      }
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

  private emitCurrentCredentialData(): void {
    const current = this.form.value;

    // Always emit validity state
    this.isValid.emit(this.form.valid);

    // Only emit credential data if there's a credential type
    if (current.credential_type) {
      this.emitCredentialByType(current as Record<string, unknown>);
    }
  }

  private emitCredentialByType(current: Record<string, unknown>): void {
    const credentialType = current.credential_type as DirectoryServiceCredentialType;

    // Validate required fields before emitting
    switch (credentialType) {
      case DirectoryServiceCredentialType.KerberosUser:
        if (current.username && current.password) {
          this.credentialUpdated.emit({
            credential_type: DirectoryServiceCredentialType.KerberosUser,
            password: current.password as string,
            username: current.username as string,
          });
        }
        break;

      case DirectoryServiceCredentialType.KerberosPrincipal:
        if (current.principal) {
          this.credentialUpdated.emit({
            credential_type: DirectoryServiceCredentialType.KerberosPrincipal,
            principal: current.principal as string,
          });
        }
        break;

      case DirectoryServiceCredentialType.LdapAnonymous:
        this.credentialUpdated.emit({
          credential_type: DirectoryServiceCredentialType.LdapAnonymous,
        });
        break;

      case DirectoryServiceCredentialType.LdapMtls:
        if (current.client_certificate) {
          this.credentialUpdated.emit({
            credential_type: DirectoryServiceCredentialType.LdapMtls,
            client_certificate: current.client_certificate as string,
          });
        }
        break;

      case DirectoryServiceCredentialType.LdapPlain:
        if (current.binddn && current.bindpw) {
          this.credentialUpdated.emit({
            credential_type: DirectoryServiceCredentialType.LdapPlain,
            binddn: current.binddn as string,
            bindpw: current.bindpw as string,
          });
        }
        break;
    }
  }

  private updateFormValidators(): void {
    // Clear validators from all controls using the validation service
    this.validationService.clearFormControlErrors(this.form);

    // Clear validators from all form controls
    Object.values(this.form.controls).forEach((control) => {
      control.clearValidators();
    });

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

    // Update validity for all controls
    Object.values(this.form.controls).forEach((control) => {
      control.updateValueAndValidity({ emitEvent: false });
    });
    this.form.updateValueAndValidity({ emitEvent: false });
  }
}
