import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { pairwise, startWith } from 'rxjs';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { newOption } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { addNewIxSelectValue } from 'app/modules/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-provider',
  templateUrl: './cloudsync-provider.component.html',
  styleUrls: ['./cloudsync-provider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudSyncProviderComponent implements OnInit {
  @Output() save = new EventEmitter<CloudSyncCredential>();

  protected form = this.formBuilder.group({
    exist_credential: [null as number | typeof newOption],
  });

  protected isLoading: boolean;
  @Output() loading = new EventEmitter<boolean>();
  private credentials: CloudSyncCredential[] = [];
  private existingCredential: CloudSyncCredential;

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private chainedComponentRef: ChainedRef<unknown>,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private cloudCredentialService: CloudCredentialService,
    private snackbarService: SnackbarService,
  ) {}

  get areActionsDisabled(): boolean {
    return this.isLoading || this.form.invalid || !this.form.controls.exist_credential.value;
  }

  ngOnInit(): void {
    this.setFormEvents();
    this.subToLoading();
    this.getExistingCredentials();
  }

  getExistingCredentials(): void {
    this.loading.emit(true);
    this.cloudCredentialService.getCloudSyncCredentials().pipe(untilDestroyed(this)).subscribe({
      next: (creds) => {
        this.credentials = creds;
      },
      complete: () => {
        this.loading.emit(false);
      },
    });
  }

  subToLoading(): void {
    this.loading.pipe(untilDestroyed(this)).subscribe({
      next: (isLoading) => {
        this.isLoading = isLoading;
      },
    });
  }

  onSubmit(): void {
    this.save.emit(this.existingCredential);
  }

  onVerify(): void {
    this.loading.emit(true);

    const payload = {
      provider: this.existingCredential.provider,
      attributes: { ...this.existingCredential.attributes },
    };
    this.ws.call('cloudsync.credentials.verify', [payload]).pipe(
      untilDestroyed(this),
    ).subscribe({
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

        this.loading.emit(false);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.loading.emit(false);
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  openAdvanced(): void {
    this.chainedComponentRef.swap(
      CloudSyncFormComponent,
      true,
    );
  }

  private setFormEvents(): void {
    this.form.controls.exist_credential.valueChanges
      .pipe(
        startWith(undefined),
        pairwise(),
        untilDestroyed(this),
      ).subscribe(([previousCreds, currentCreds]) => {
        const isPreviousValueAddNew = previousCreds != null && previousCreds.toString() === addNewIxSelectValue;
        const isCurrentValueExists = currentCreds != null;
        const isCurrentValueAddNew = isCurrentValueExists && currentCreds.toString() === addNewIxSelectValue;

        if (!isCurrentValueExists || isCurrentValueAddNew) {
          return;
        }

        if (!isPreviousValueAddNew) {
          this.emitSelectedCredential(currentCreds as number);
          return;
        }

        this.loading.emit(true);
        this.cloudCredentialService.getCloudSyncCredentials().pipe(untilDestroyed(this)).subscribe({
          next: (creds) => {
            this.credentials = creds;
            this.emitSelectedCredential(currentCreds as number);
          },
          complete: () => {
            this.loading.emit(false);
          },
        });
      });
  }

  emitSelectedCredential(credsId: number): void {
    this.existingCredential = this.credentials.find((credential) => credential.id === credsId);
    this.save.emit(this.existingCredential);
    this.cdr.markForCheck();
  }
}
