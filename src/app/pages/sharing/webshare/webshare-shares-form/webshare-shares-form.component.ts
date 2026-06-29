import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef, computed, effect, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnInputComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
  isHomeBase?: boolean;
}

@Component({
  selector: 'ix-webshare-shares-form',
  templateUrl: './webshare-shares-form.component.html',
  styleUrls: ['./webshare-shares-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    TnBannerComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnTooltipDirective,
    TranslateModule,
  ],
  providers: [WebShareValidatorService],
})
export class WebShareSharesFormComponent extends SidePanelForm implements OnInit {
  protected readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];
  protected readonly helptext = helptextSharingWebshare;

  /** Form data when hosted in a `<tn-side-panel>` (the legacy SlideIn host provides it via `slideInRef`). */
  readonly data = input<WebShareFormData>();

  readonly isFormLoading = signal(true);
  protected webShares = signal<WebShare[]>([]);

  /**
   * The ID of the share being edited, or null if creating a new share.
   * Used to exclude the current share from home share validation.
   */
  private editingShareId = signal<number | null>(null);

  /**
   * Computes the existing home share from other shares (excluding the one being edited).
   * Returns null if no other share is designated as home.
   */
  protected existingHomeShare = computed(() => {
    const excludeId = this.editingShareId();
    const shares = this.webShares();
    const otherShares = excludeId !== null
      ? shares.filter((share) => share.id !== excludeId)
      : shares;
    return otherShares.find((share) => share.is_home_base) ?? null;
  });

  /**
   * Tooltip shown on hover when home share checkbox is disabled.
   * Explains which share is already designated as home.
   */
  protected disabledHomeShareTooltip = computed(() => {
    const existing = this.existingHomeShare();
    if (existing) {
      return this.translate.instant(
        helptextSharingWebshare.validation_errors.home_share_exists,
        { name: existing.name },
      );
    }
    return '';
  });

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private dialog = inject(DialogService);
  private validatorService = inject(WebShareValidatorService);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    ]],
    path: ['', Validators.required],
    is_home_base: [false],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  /** Resolves form data from whichever host opened the form. */
  private get incomingData(): WebShareFormData | undefined {
    return (this.slideInRef?.getData() as WebShareFormData | undefined) ?? this.data();
  }

  constructor() {
    super();

    // Disable home share checkbox when another share is already designated as home
    effect(() => {
      const existing = this.existingHomeShare();
      const control = this.form.controls.is_home_base;
      if (existing) {
        control.disable();
      } else {
        control.enable();
      }
    });
  }

  get isNew(): boolean {
    return this.incomingData?.isNew || false;
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
    // Set editingShareId before loading shares so the computed signal works correctly
    const data = this.incomingData;
    const shareId: number | undefined = data?.id;
    this.editingShareId.set(data?.isNew ? null : (shareId ?? null));

    this.loadWebShares();
    this.setupValidators();
    this.initializeFormData();
    // Setup auto-populate AFTER initializing form data to avoid treating
    // initialization as user editing
    this.setupPathAutoPopulate();
  }

  private initializeFormData(): void {
    const data = this.incomingData;
    if (data) {
      if (!data.isNew && data.name) {
        // Editing existing WebShare
        this.form.patchValue({
          name: data.name,
          path: data.path,
          is_home_base: data.isHomeBase ?? false,
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

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload = {
      name: values.name,
      path: values.path,
      is_home_base: values.is_home_base,
    };

    this.isFormLoading.set(true);
    this.form.disable();

    const apiCall$ = this.isNew
      ? this.api.call('sharing.webshare.create', [payload])
      : this.api.call('sharing.webshare.update', [this.incomingData?.id, payload]);

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

          this.close(true);
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
          this.isFormLoading.set(false);
          this.form.enable();
          // Set webShares AFTER form.enable() so the effect can properly
          // disable the home share checkbox if needed
          this.webShares.set(shares);
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
            stackTrace: error instanceof Error ? error.message : String(error),
          });
          this.close(false);
        },
      });
  }

  private setupValidators(): void {
    const excludeId: number | null = this.isNew ? null : (this.incomingData?.id ?? null);

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
