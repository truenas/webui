import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, Type, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnFormSectionComponent } from '@truenas/ui-components';
import {
  catchError, EMPTY, of, pairwise, startWith,
} from 'rxjs';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { newOption } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { addNewIxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';

@Component({
  selector: 'ix-cloudsync-provider',
  templateUrl: './cloudsync-provider.component.html',
  styleUrls: ['./cloudsync-provider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    CloudCredentialsSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class CloudSyncProviderComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  // Optional: the wizard is hosted in the `<tn-side-panel>` form panel (no SlideInRef); the wizard's
  // own closeGuard covers unsaved changes there, and "Advanced Options" swaps via {@link formPanel}.
  private slideInRef = inject<SlideInRef<unknown, unknown>>(SlideInRef, { optional: true });
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private cloudCredentialService = inject(CloudCredentialService);
  private snackbarService = inject(SnackbarService);
  private stepper = inject(MatStepper);
  private destroyRef = inject(DestroyRef);

  readonly save = output<CloudSyncCredential>();
  readonly loading = output<boolean>();

  protected form = this.formBuilder.group({
    exist_credential: [null as number | typeof newOption | null],
  });

  protected isLoading: boolean;

  private credentials: CloudSyncCredential[] = [];
  private existingCredential: CloudSyncCredential;

  readonly helptext = helptext;

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  get areActionsDisabled(): boolean {
    return this.isLoading || this.form.invalid || !this.form.controls.exist_credential.value;
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  ngOnInit(): void {
    this.setFormEvents();
    this.subToLoading();
    this.getExistingCredentials();
  }

  private getExistingCredentials(): void {
    this.loading.emit(true);
    this.cloudCredentialService.getCloudSyncCredentials()
      .pipe(
        catchError((error: unknown) => {
          this.loading.emit(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (creds) => {
          this.credentials = creds;
        },
        complete: () => {
          this.loading.emit(false);
        },
      });
  }

  private subToLoading(): void {
    this.loading.subscribe((isLoading) => this.isLoading = isLoading);
  }

  onSubmit(): void {
    this.save.emit(this.existingCredential);
  }

  protected onNext(): void {
    this.stepper.next();
  }

  onVerify(): void {
    this.loading.emit(true);

    const payload = this.existingCredential.provider;
    this.api.call('cloudsync.credentials.verify', [payload]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        if (response.valid) {
          this.snackbarService.success(this.translate.instant('The credentials are valid.'));
        } else {
          this.dialogService.error({
            title: this.translate.instant('Error'),
            message: response.excerpt || '',
            stackTrace: response.error,
          });
        }

        this.loading.emit(false);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.loading.emit(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  openAdvanced(): void {
    // Swap the wizard out for the advanced form within the same panel (footered — the form's Save +
    // "Switch To Wizard" live in the panel footer).
    this.formPanel.swap(CloudSyncFormComponent as unknown as Type<SidePanelForm>, {
      title: this.translate.instant('Add Cloud Sync Task'),
      wide: true,
    });
  }

  private setFormEvents(): void {
    this.form.controls.exist_credential.valueChanges
      .pipe(
        startWith(undefined),
        pairwise(),
        takeUntilDestroyed(this.destroyRef),
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
        this.cloudCredentialService.getCloudSyncCredentials().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  private emitSelectedCredential(credsId: number): void {
    this.existingCredential = this.credentials.find((credential) => credential.id === credsId);
    this.save.emit(this.existingCredential);
    this.cdr.markForCheck();
  }
}
