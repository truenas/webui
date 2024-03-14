import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSshKeypairs } from 'app/helptext/system/ssh-keypairs';
import { KeychainCredentialUpdate, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { atLeastOne } from 'app/modules/ix-forms/validators/at-least-one-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './ssh-keypair-form.component.html',
  styleUrls: ['./ssh-keypair-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SshKeypairFormComponent implements OnInit {
  protected requiredRoles = [Role.KeychainCredentialWrite];

  get isNew(): boolean {
    return !this.editingKeypair;
  }

  isFormLoading = false;

  form = this.fb.group({
    name: ['', Validators.required],
    private_key: [''],
    public_key: ['', atLeastOne('private_key', [helptextSshKeypairs.private_key_placeholder, helptextSshKeypairs.public_key_placeholder])],
  });

  readonly tooltips = {
    name: helptextSshKeypairs.name_tooltip,
    privateKey: helptextSshKeypairs.private_key_tooltip,
    publicKey: helptextSshKeypairs.public_key_tooltip,
  };

  readonly keyInstructions = helptextSshKeypairs.key_instructions;

  readonly canDownloadPublicKey$ = this.form.value$.pipe(map((value) => value.name && value.public_key));
  readonly canDownloadPrivateKey$ = this.form.value$.pipe(map((value) => value.name && value.private_key));

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<SshKeypairFormComponent>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private loader: AppLoaderService,
    private download: DownloadService,
    @Inject(SLIDE_IN_DATA) private editingKeypair: KeychainSshKeyPair,
  ) { }

  ngOnInit(): void {
    if (this.editingKeypair) {
      this.setKeypairForEditing();
    }
  }

  setKeypairForEditing(): void {
    this.form.patchValue({
      name: this.editingKeypair.name,
      private_key: this.editingKeypair.attributes.private_key,
      public_key: this.editingKeypair.attributes.public_key,
    });
  }

  onGenerateButtonPressed(): void {
    this.ws.call('keychaincredential.generate_ssh_key_pair')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((keyPair) => {
        this.form.patchValue({
          public_key: keyPair.public_key,
          private_key: keyPair.private_key,
        });
      });
  }

  onDownloadKey(keyType: 'private_key' | 'public_key'): void {
    const name = this.form.value.name;
    const key = this.form.controls[keyType].value;
    const filename = `${name}_${keyType}_rsa`;
    const blob = new Blob([key], { type: 'text/plain' });
    this.download.downloadBlob(blob, filename);
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody: KeychainCredentialUpdate = {
      name: values.name,
      attributes: {
        private_key: values.private_key,
        public_key: values.public_key,
      },
    };

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('keychaincredential.create', [{
        ...commonBody,
        type: KeychainCredentialType.SshKeyPair,
      }]);
    } else {
      request$ = this.ws.call('keychaincredential.update', [
        this.editingKeypair.id,
        commonBody,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('SSH Keypair created'));
        } else {
          this.snackbar.success(this.translate.instant('SSH Keypair updated'));
        }

        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
