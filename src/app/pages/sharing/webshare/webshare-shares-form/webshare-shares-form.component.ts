import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareValidatorService } from 'app/pages/sharing/webshare/webshare-validator.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

export interface WebShareFormData {
  id?: number;
  name: string;
  path: string;
  isNew: boolean;
}

@Component({
  selector: 'ix-webshare-shares-form',
  templateUrl: './webshare-shares-form.component.html',
  styleUrls: ['./webshare-shares-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxIconComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
  providers: [WebShareValidatorService],
})
export class WebShareSharesFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWrite];
  protected readonly helptext = helptextSharingWebshare;

  createDatasetProps: Omit<DatasetCreate, 'name'> = {
    share_type: DatasetPreset.Generic,
  };

  protected isFormLoading = signal(true);
  protected webShares = signal<WebShare[]>([]);

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private dialog = inject(DialogService);
  private validatorService = inject(WebShareValidatorService);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  slideInRef = inject(SlideInRef<WebShareFormData, boolean>);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);


  form = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    ]],
    path: ['', Validators.required],
  });

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  get isNew(): boolean {
    return this.slideInRef.getData()?.isNew || false;
  }

  get title(): string {
    return this.isNew
      ? this.helptext.webshare_form_title_add
      : this.helptext.webshare_form_title_edit;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    directoriesOnly: true,
    includeSnapshots: false,
  });


  ngOnInit(): void {
    this.loadWebShares();
    this.setupValidators();
    this.initializeFormData();
    // Setup auto-populate AFTER initializing form data to avoid treating
    // initialization as user editing
    this.setupPathAutoPopulate();
  }

  private initializeFormData(): void {
    const data = this.slideInRef.getData();
    if (data) {
      if (!data.isNew && data.name) {
        // Editing existing WebShare
        this.form.patchValue({
          name: data.name,
          path: data.path,
        });
      } else if (data.isNew && (data.name || data.path)) {
        // Creating new WebShare with pre-filled values
        this.form.patchValue({
          name: data.name || '',
          path: data.path || '',
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload = {
      name: values.name,
      path: values.path,
    };

    this.isFormLoading.set(true);
    this.form.disable();

    const apiCall$ = this.isNew
      ? this.api.call('sharing.webshare.create', [payload])
      : this.api.call('sharing.webshare.update', [this.slideInRef.getData().id, payload]);

    apiCall$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.form.enable();
          this.snackbar.success(
            this.isNew
              ? this.translate.instant('WebShare added successfully')
              : this.translate.instant('WebShare updated successfully'),
          );

          // Check if the WebShare service is enabled when adding a new share
          if (this.isNew) {
            this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.WebShare }));
          }

          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.form.enable();
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private loadWebShares(): void {
    this.api.call('sharing.webshare.query', [[]])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (shares) => {
          this.webShares.set(shares);
          this.isFormLoading.set(false);
          this.form.enable();
          // Mark form as untouched after enabling to prevent validation errors
          // from showing immediately on form load
          this.form.markAsUntouched();
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.form.enable();
          this.dialog.error({
            title: this.translate.instant('Error Loading WebShares'),
            message: this.translate.instant('Could not retrieve existing WebShare configurations. Please check your connection and try again.'),
            stackTrace: (error as Error)?.message,
          });
          this.slideInRef.close({ response: false, error: null });
        },
      });
  }

  private setupValidators(): void {
    const excludeId: number | null = this.isNew ? null : (this.slideInRef.getData()?.id ?? null);

    const nameControl = this.form.controls.name as FormControl;
    nameControl.addAsyncValidators(
      this.validatorService.validateWebShareName(this.webShares, excludeId),
    );

    const pathControl = this.form.controls.path as FormControl;
    pathControl.addValidators(
      this.validatorService.validateWebSharePath(),
    );
    pathControl.addAsyncValidators(
      this.validatorService.validateWebSharePathNesting(
        this.webShares,
        excludeId,
      ),
    );
  }

  private setupPathAutoPopulate(): void {
    // Only auto-populate for new WebShares
    if (!this.isNew) {
      return;
    }

    // Auto-populate name from path when path changes
    this.form.controls.path.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((path: string) => {
        // Auto-populate name only if:
        // 1. Name field is currently empty
        // 2. Path is not empty
        // This allows auto-population even if a pre-filled name was cleared by the user
        if (!this.form.controls.name.value && path) {
          // Extract the last directory name from the path
          const pathParts = path.split('/').filter((part) => part);
          if (pathParts.length > 0) {
            const lastDirectoryName = pathParts[pathParts.length - 1];
            // Set the name field with the last directory name
            this.form.controls.name.setValue(lastDirectoryName);
          }
        }
      });
  }
}
