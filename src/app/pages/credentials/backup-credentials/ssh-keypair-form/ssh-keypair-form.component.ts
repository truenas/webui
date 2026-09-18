import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSshKeypairs } from 'app/helptext/system/ssh-keypairs';
import { KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { atLeastOne } from 'app/modules/forms/ix-forms/validators/at-least-one-validation';
import { LoaderService } from 'app/modules/loader/loader.service';
import {
  SidePanelFooterMenu,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-ssh-keypair-form',
  templateUrl: './ssh-keypair-form.component.html',
  styleUrls: ['./ssh-keypair-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class SshKeypairFormComponent extends IxFormHostForm {
  private fb = inject(FormBuilder);
  private api = inject(TypedApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private download = inject(DownloadService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.KeychainCredentialWrite];

  /** The record being edited, supplied by the `<tn-side-panel>` host (undefined = create). */
  readonly editKeypair = input<KeychainSshKeyPair | undefined>(undefined);

  /** The record's keys live under `attributes`; flatten them onto the controls. */
  protected transformEditKeypair = (data: unknown): Record<string, unknown> => {
    const keypair = data as KeychainSshKeyPair;
    return {
      name: keypair.name,
      private_key: keypair.attributes.private_key,
      public_key: keypair.attributes.public_key,
    };
  };

  protected form = this.fb.group({
    name: ['', Validators.required],
    private_key: [''],
    public_key: ['', atLeastOne('private_key', [helptextSshKeypairs.privateKeyLabel, helptextSshKeypairs.publicKeyLabel])],
  });

  readonly tooltips = {
    name: helptextSshKeypairs.nameTooltip,
    privateKey: helptextSshKeypairs.privateKeyTooltip,
    publicKey: helptextSshKeypairs.publicKeyTooltip,
  };

  readonly keyInstructions = helptextSshKeypairs.keyInstructions;

  /**
   * A "Download" dropdown rendered as a 3-dots icon-button in the `<tn-side-panel>` footer beside
   * Save. Each item is enabled only once the keypair has a name and the corresponding key is present.
   */
  readonly footerMenu = computed<SidePanelFooterMenu>(() => ({
    label: T('Download'),
    testId: 'download-actions',
    items: [
      {
        label: T('Download Private Key'),
        testId: 'download-private-key',
        disabled: () => !this.canDownloadKey('private_key'),
        onClick: () => this.onDownloadKey('private_key'),
      },
      {
        label: T('Download Public Key'),
        testId: 'download-public-key',
        disabled: () => !this.canDownloadKey('public_key'),
        onClick: () => this.onDownloadKey('public_key'),
      },
    ],
  }));

  protected onGenerateButtonPressed(): void {
    this.api.call('keychaincredential.generate_ssh_key_pair')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((keyPair) => {
        this.form.patchValue({
          public_key: keyPair.public_key,
          private_key: keyPair.private_key,
        });
      });
  }

  private canDownloadKey(keyType: 'private_key' | 'public_key'): boolean {
    const value = this.form.value;
    return Boolean(value.name && value[keyType]);
  }

  protected onDownloadKey(keyType: 'private_key' | 'public_key'): void {
    const name = this.form.value.name;
    const key = this.form.controls[keyType].value;
    const filename = `${name}_${keyType}_rsa`;
    const blob = new Blob([key], { type: 'text/plain' });
    this.download.downloadBlob(blob, filename);
  }

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    const values = this.form.value;
    const commonBody: Omit<KeychainSshKeyPair, 'id' | 'type'> = {
      name: values.name,
      attributes: {
        private_key: values.private_key,
        public_key: values.public_key,
      },
    };
    const editingKeypair = this.editKeypair();

    return {
      request$: editingKeypair
        ? this.api.call('keychaincredential.update', [editingKeypair.id, commonBody])
        : this.api.call('keychaincredential.create', [{
            ...commonBody,
            type: KeychainCredentialType.SshKeyPair,
          }]),
      successMessage: event.isEdit
        ? this.translate.instant('SSH Keypair updated')
        : this.translate.instant('SSH Keypair created'),
    };
  };
}
