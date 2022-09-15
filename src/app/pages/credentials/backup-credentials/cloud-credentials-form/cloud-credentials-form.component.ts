import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudsyncCredential, CloudsyncCredentialUpdate } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
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
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

// TODO: Form is partially backend driven and partially hardcoded on the frontend.
@UntilDestroy()
@Component({
  templateUrl: './cloud-credentials-form.component.html',
  styleUrls: ['./cloud-credentials-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudCredentialsFormComponent implements OnInit {
  commonForm = this.formBuilder.group({
    name: ['', Validators.required],
    provider: [CloudsyncProviderName.Storj],
  });

  isLoading = false;
  existingCredential: CloudsyncCredential;
  providers: CloudsyncProvider[] = [];
  providerOptions: Observable<Option[]> = of([]);
  providerForm: BaseProviderFormComponent;

  @ViewChild('providerFormContainer', { static: true, read: ViewContainerRef }) providerFormContainer: ViewContainerRef;

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbarService: SnackbarService,
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
  }

  setCredentialsForEdit(credential: CloudsyncCredential): void {
    this.existingCredential = credential;
    this.commonForm.patchValue(credential);

    if (this.providerForm) {
      this.providerForm.setValues(this.existingCredential.attributes);
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
          this.slideInService.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
        // TODO: Errors for nested provider form will be shown in a modal. Can be improved.
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.commonForm);
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
            this.dialogService.info(
              this.translate.instant('Valid'),
              this.translate.instant('The credentials are valid.'),
            );
          } else {
            this.dialogService.errorReport('Error', response.excerpt, response.error);
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.commonForm);
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
            this.providerForm.setValues(this.existingCredential.attributes);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          new EntityUtils().handleWsError(null, error, this.dialogService);
          this.slideInService.close();
        },
      });
  }

  private setFormEvents(): void {
    this.commonForm.controls.provider.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.renderProviderForm();
      });
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
