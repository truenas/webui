import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import helptext from 'app/helptext/system/ssh-keypairs';
import { KeychainCredentialUpdate, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { atLeastOne } from 'app/modules/entity/entity-form/validators/at-least-one-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  AppLoaderService, DialogService, StorageService,
} from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './ssh-keypair-form.component.html',
  styleUrls: ['./ssh-keypair-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SshKeypairFormComponent {
  private editingKeypair: KeychainSshKeyPair;
  get isNew(): boolean {
    return !this.editingKeypair;
  }

  isFormLoading = false;

  form = this.fb.group({
    name: ['', Validators.required],
    private_key: [''],
    public_key: ['', atLeastOne('private_key', [helptext.private_key_placeholder, helptext.public_key_placeholder])],
  });

  readonly tooltips = {
    name: helptext.name_tooltip,
    privateKey: helptext.private_key_tooltip,
    publicKey: helptext.public_key_tooltip,
  };

  readonly keyInstructions = helptext.key_instructions;

  readonly canDownloadPublicKey$ = this.form.value$.pipe(map((value) => value.name && value.public_key));
  readonly canDownloadPrivateKey$ = this.form.value$.pipe(map((value) => value.name && value.private_key));

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private storage: StorageService,
  ) {}

  setKeypairForEditing(keypair: KeychainSshKeyPair): void {
    this.editingKeypair = keypair;
    this.form.patchValue({
      name: this.editingKeypair.name,
      private_key: this.editingKeypair.attributes.private_key,
      public_key: this.editingKeypair.attributes.public_key,
    });
  }

  onGenerateButtonPressed(): void {
    this.loader.open();
    this.ws.call('keychaincredential.generate_ssh_key_pair').pipe(untilDestroyed(this)).subscribe({
      next: (keyPair) => {
        this.loader.close();
        this.form.patchValue({
          public_key: keyPair.public_key,
          private_key: keyPair.private_key,
        });
      },
      error: (err: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(err));
      },
    });
  }

  onDownloadKey(keyType: 'private_key' | 'public_key'): void {
    const name = this.form.value.name;
    const key = this.form.controls[keyType].value;
    const filename = `${name}_${keyType}_rsa`;
    const blob = new Blob([key], { type: 'text/plain' });
    this.storage.downloadBlob(blob, filename);
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
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.closeAll();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
