import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, Inject,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudsyncCredential, CloudsyncCredentialUpdate } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  AzureProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/azure-provider-form/azure-provider-form.component';
import {
  BackblazeB2ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import {
  FtpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';
import {
  GoogleCloudProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';
import {
  GoogleDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';
import {
  HttpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';
import {
  MegaProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';
import {
  OneDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';
import {
  OpenstackSwiftProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/openstack-swift-provider-form/openstack-swift-provider-form.component';
import {
  PcloudProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/pcloud-provider-form/pcloud-provider-form.component';
import {
  S3ProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';
import {
  SftpProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';
import {
  StorjProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import {
  TokenProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/token-provider-form/token-provider-form.component';
import {
  WebdavProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Form is partially backend driven and partially hardcoded on the frontend.
@UntilDestroy()
@Component({
  templateUrl: './cloud-credentials-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudCredentialsFormComponent implements OnInit {
  commonForm = this.formBuilder.group({
    name: ['Storj', Validators.required],
    provider: [CloudsyncProviderName.Storj],
  });

  isLoading = false;
  existingCredential: CloudsyncCredential;
  providers: CloudsyncProvider[] = [];
  providerOptions = of<Option[]>([]);
  providerForm: BaseProviderFormComponent;

  @ViewChild('providerFormContainer', { static: true, read: ViewContainerRef }) providerFormContainer: ViewContainerRef;

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private slideInRef: IxSlideInRef<CloudCredentialsFormComponent>,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbarService: SnackbarService,
    @Inject(SLIDE_IN_DATA) private credential: CloudsyncCredential,
  ) {
    // Has to be earlier than potential `setCredentialsForEdit` call
    this.setFormEvents();
  }

  get isNew(): boolean {
    return !this.existingCredential;
  }

  get selectedProvider(): CloudsyncProvider {
    return this.providers?.find((provider) => {
      return provider.name === this.commonForm.controls.provider.value;
    });
  }

  get areActionsDisabled(): boolean {
    return this.isLoading
      || this.commonForm.invalid
      || this.providerForm?.form?.invalid;
  }

  ngOnInit(): void {
    this.loadProviders();

    if (this.credential) {
      this.setCredentialsForEdit();
    }
  }

  setCredentialsForEdit(): void {
    this.existingCredential = this.credential;
    this.commonForm.patchValue(this.existingCredential);

    if (this.providerForm) {
      this.providerForm.getFormSetter$().next(this.existingCredential.attributes);
    }
  }

  onSubmit(): boolean {
    this.isLoading = true;

    const beforeSubmit$ = this.providerForm.beforeSubmit();

    beforeSubmit$
      .pipe(
        switchMap(() => {
          const payload = this.preparePayload();
          return this.isNew
            ? this.ws.call('cloudsync.credentials.create', [payload])
            : this.ws.call('cloudsync.credentials.update', [this.existingCredential.id, payload]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackbarService.success(
            this.isNew
              ? this.translate.instant('Cloud credential added.')
              : this.translate.instant('Cloud credential updated.'),
          );
          this.slideInRef.close(true);
          this.cdr.markForCheck();
        },
        error: (error) => {
        // TODO: Errors for nested provider form will be shown in a modal. Can be improved.
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.commonForm);
          this.cdr.markForCheck();
        },
      });

    return false;
  }

  onVerify(): void {
    this.isLoading = true;

    const beforeSubmit$ = this.providerForm.beforeSubmit();

    beforeSubmit$
      .pipe(
        switchMap(() => {
          const { name, ...payload } = this.preparePayload();

          return this.ws.call('cloudsync.credentials.verify', [payload]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: (response) => {
          if (response.valid) {
            this.snackbarService.success(this.translate.instant('The credentials are valid.'));
          } else {
            this.dialogService.error({
              title: this.translate.instant('Error'),
              message: response.excerpt,
              backtrace: response.error,
            });
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.commonForm);
          this.cdr.markForCheck();
        },
      });
  }

  private preparePayload(): CloudsyncCredentialUpdate {
    const commonValues = this.commonForm.value;
    return {
      name: commonValues.name,
      provider: commonValues.provider,
      attributes: this.providerForm.getSubmitAttributes(),
    };
  }

  private loadProviders(): void {
    this.isLoading = true;
    this.ws.call('cloudsync.providers')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (providers) => {
          this.providers = providers;
          this.providerOptions = of(
            providers.map((provider) => ({
              label: provider.title,
              value: provider.name,
            })),
          );
          this.renderProviderForm();
          if (this.existingCredential) {
            this.providerForm.getFormSetter$().next(this.existingCredential.attributes);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.slideInRef.close();
        },
      });
  }

  private setFormEvents(): void {
    this.commonForm.controls.provider.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.renderProviderForm();

        this.setDefaultName();
      });
  }

  private setDefaultName(): void {
    if (!this.isNew || this.commonForm.controls.name.touched) {
      return;
    }

    this.commonForm.controls.name.setValue(this.selectedProvider.title);
  }

  private renderProviderForm(): void {
    this.providerFormContainer?.clear();
    if (!this.selectedProvider) {
      return;
    }

    const formClass = this.getProviderFormClass();
    const formRef = this.providerFormContainer.createComponent(formClass);
    formRef.instance.provider = this.selectedProvider;
    this.providerForm = formRef.instance;
  }

  private getProviderFormClass(): Type<BaseProviderFormComponent> {
    const tokenOnlyProviders = [
      CloudsyncProviderName.Box,
      CloudsyncProviderName.Dropbox,
      CloudsyncProviderName.GooglePhotos,
      CloudsyncProviderName.Hubic,
      CloudsyncProviderName.Yandex,
    ];
    if (tokenOnlyProviders.includes(this.selectedProvider.name)) {
      return TokenProviderFormComponent;
    }

    const formMapping = new Map<CloudsyncProviderName, Type<BaseProviderFormComponent>>([
      [CloudsyncProviderName.MicrosoftAzure, AzureProviderFormComponent],
      [CloudsyncProviderName.BackblazeB2, BackblazeB2ProviderFormComponent],
      [CloudsyncProviderName.Ftp, FtpProviderFormComponent],
      [CloudsyncProviderName.GoogleCloudStorage, GoogleCloudProviderFormComponent],
      [CloudsyncProviderName.GoogleDrive, GoogleDriveProviderFormComponent],
      [CloudsyncProviderName.Http, HttpProviderFormComponent],
      [CloudsyncProviderName.Mega, MegaProviderFormComponent],
      [CloudsyncProviderName.MicrosoftOnedrive, OneDriveProviderFormComponent],
      [CloudsyncProviderName.OpenstackSwift, OpenstackSwiftProviderFormComponent],
      [CloudsyncProviderName.Pcloud, PcloudProviderFormComponent],
      [CloudsyncProviderName.AmazonS3, S3ProviderFormComponent],
      [CloudsyncProviderName.Sftp, SftpProviderFormComponent],
      [CloudsyncProviderName.Storj, StorjProviderFormComponent],
      [CloudsyncProviderName.Webdav, WebdavProviderFormComponent],
    ]);

    return formMapping.get(this.selectedProvider.name);
  }
}
