import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, viewChild, inject, input, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, combineLatest, filter, forkJoin, map, Observable, of, switchMap, throwError,
} from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { SmbSharePurpose } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import {
  advancedModeFooterAction, SidePanelFooterAction,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  EncryptionSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/encryption-section/encryption-section.component';
import {
  NameAndOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/name-and-options-section/name-and-options-section.component';
import {
  OtherOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/other-options-section/other-options-section.component';
import {
  QuotasSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/quotas-section/quotas-section.component';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

/** The saved dataset, paired with whether the user accepted the post-save ACL-editor prompt. */
type SaveDatasetResult = [Dataset, boolean];

/** What {@link DatasetFormComponent.preparePayload} needs from a section, whichever one it is. */
interface DatasetFormSection {
  getPayload: () => Partial<DatasetCreate> | Partial<DatasetUpdate>;
}

/**
 * Closes with the saved dataset, or `null` on the name length/depth bail-out — `FormSidePanelService`
 * reads that falsy payload as a cancel, so openers can safely `open<Dataset>(…)`.
 */
@Component({
  selector: 'ix-dataset-form',
  templateUrl: './dataset-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    NameAndOptionsSectionComponent,
    QuotasSectionComponent,
    EncryptionSectionComponent,
    OtherOptionsSectionComponent,
  ],
})
export class DatasetFormComponent extends IxFormHostForm<Dataset | null> implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private datasetFormService = inject(DatasetFormService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);

  private destroyRef = inject(DestroyRef);

  /** Create/edit parameters supplied by the `<tn-side-panel>` host. */
  readonly params = input.required<{ datasetId: string; isNew: boolean }>();

  private nameAndOptionsSection = viewChild.required(NameAndOptionsSectionComponent);
  private encryptionSection = viewChild(EncryptionSectionComponent);
  private quotasSection = viewChild(QuotasSectionComponent);
  private otherOptionsSection = viewChild(OtherOptionsSectionComponent);

  readonly requiredRoles = [Role.DatasetWrite];

  protected readonly isNameAndOptionsValid = signal(true);
  protected readonly isQuotaValid = signal(true);
  protected readonly isEncryptionValid = signal(true);
  protected readonly isOtherOptionsValid = signal(true);

  protected isLoading = signal(false);
  protected readonly isAdvancedMode = signal(false);
  protected readonly datasetPreset = signal(DatasetPreset.Generic);

  form = new FormGroup({});

  /**
   * A plain AND: each signal stays meaningful whether or not its section is on screen. Encryption
   * counts even in basic mode, where its fields are hidden — its payload is part of every create.
   */
  protected readonly areSubFormsValid = computed(() => {
    return this.isNameAndOptionsValid()
      && this.isQuotaValid()
      && this.isEncryptionValid()
      && this.isOtherOptionsValid();
  });

  /**
   * The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). `testId`
   * pins the `data-test` value this form's in-body toggle already ships with.
   */
  private readonly advancedToggle = advancedModeFooterAction(this.isAdvancedMode, {
    testId: 'toggle-advanced',
    onToggle: (isAdvanced) => {
      if (!isAdvanced) {
        // Leaving advanced unmounts the quotas section, so its last verdict goes with it. A stale
        // `false` left parked here would be flipped by the remounted section's on-mount emission
        // during the same CD pass that already read it — NG0100 in dev mode.
        this.isQuotaValid.set(true);
      }
    },
  });

  /**
   * A getter because `HostedSidePanelForm` types `footerActions` as a plain array. Create only: on
   * edit, quotas and encryption are create-only and Other Options is advanced-only, so switching
   * back to basic would leave nothing on screen but the disabled Name field.
   */
  get footerActions(): SidePanelFooterAction[] {
    return this.isNew() ? this.advancedToggle() : [];
  }

  protected readonly parentDataset = signal<Dataset | undefined>(undefined);
  protected readonly existingDataset = signal<Dataset | undefined>(undefined);

  /** Mountpoint to open the ACL editor at, set only when the post-save ACL prompt was accepted. */
  private aclEditorPath: string | undefined;

  /**
   * Taken from the host's params rather than `!existingDataset()`: that record only lands once the
   * edit load resolves, so deriving from it would report "new" for the whole load and mount (then
   * immediately tear down) the create-only sections.
   */
  protected readonly isNew = computed(() => this.params().isNew);

  /**
   * An edit panel whose load in {@link setForEdit} failed. Blocks Save: the Name field stays enabled
   * until `existing` lands, so the user could otherwise fill in a name, satisfy every section, and
   * submit a create payload rooted at the pool from an edit panel.
   */
  protected readonly isMissingEditRecord = computed(() => !this.isNew() && !this.existingDataset());

  /**
   * A create panel whose parent load in {@link setForNew} failed. Blocks Save: a create is filed
   * under `${parent.name}/${name}`, so submitting without one asks for `undefined/my-dataset`.
   */
  protected readonly isMissingParent = computed(() => this.isNew() && !this.parentDataset());

  /** Filtered, not positional: three of the four section view queries are optional. */
  private get createSections(): DatasetFormSection[] {
    return this.toSections([
      this.nameAndOptionsSection(),
      this.encryptionSection(),
      this.otherOptionsSection(),
      this.isAdvancedMode() ? this.quotasSection() : undefined,
    ]);
  }

  private get updateSections(): DatasetFormSection[] {
    return this.toSections([
      this.nameAndOptionsSection(),
      this.otherOptionsSection(),
    ]);
  }

  private toSections(sections: (DatasetFormSection | undefined)[]): DatasetFormSection[] {
    return sections.filter((section): section is DatasetFormSection => Boolean(section));
  }

  /**
   * The `FormGroup`s that actually hold fields, for backend validation errors to be resolved
   * against. An unmounted section has no field on screen to carry an error, so it is skipped and
   * the handler falls back to a modal for that message.
   */
  private sectionForms(): FormGroup[] {
    const nameAndOptions = this.nameAndOptionsSection();

    return [
      nameAndOptions.form,
      // Its own group (SMB/NFS share presets), sibling to the section's main one.
      nameAndOptions.datasetPresetForm,
      this.quotasSection()?.form,
      this.encryptionSection()?.form,
      this.otherOptionsSection()?.form,
    ].filter((form): form is FormGroup => Boolean(form));
  }

  override hasUnsavedChanges(): boolean {
    // The root group holds no fields, so the sections' own groups are what carries edits — including
    // the share-preset one, whose "Create SMB Share" toggle would otherwise discard silently.
    return this.form.dirty || this.sectionForms().some((form) => form.dirty);
  }

  ngOnInit(): void {
    const { isNew } = this.params();

    if (isNew) {
      this.setForNew();
    } else {
      this.setForEdit();
    }
  }

  ngAfterViewInit(): void {
    this.nameAndOptionsSection().form.controls.share_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((datasetPreset) => {
        this.datasetPreset.set(datasetPreset);
      });
  }

  private setForNew(): void {
    this.isLoading.set(true);

    this.datasetFormService.checkAndWarnForLengthAndDepth(this.params().datasetId).pipe(
      filter((isValidLengthAndDepth) => {
        if (!isValidLengthAndDepth) {
          // Falsy payload — the host reads it as a cancel and just closes the panel.
          this.isLoading.set(false);
          this.closed.emit(null);
        }
        return isValidLengthAndDepth;
      }),
      switchMap(() => this.datasetFormService.loadDataset(this.params().datasetId)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (dataset) => {
        this.parentDataset.set(dataset);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private setForEdit(): void {
    // Edit renders Other Options only in advanced mode (quotas/encryption stay create-only), so a
    // basic-mode edit panel would show nothing but the disabled Name field. Start expanded.
    this.isAdvancedMode.set(true);

    const requests = [
      this.datasetFormService.loadDataset(this.params().datasetId),
    ];

    const parentId = this.params().datasetId.split('/').slice(0, -1).join('/');
    if (parentId) {
      requests.push(this.datasetFormService.loadDataset(parentId));
    }

    this.isLoading.set(true);

    forkJoin(requests).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([existingDataset, parent]) => {
        this.existingDataset.set(existingDataset);
        this.parentDataset.set(parent);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected onSwitchToAdvanced(): void {
    this.isAdvancedMode.set(true);
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult<Dataset, SaveDatasetResult> => {
    const payload = this.preparePayload();
    const existingDataset = this.existingDataset();

    let request$: Observable<Dataset>;
    if (this.isNew()) {
      request$ = this.api.call('pool.dataset.create', [payload as DatasetCreate]);
    } else if (existingDataset) {
      request$ = this.api.call('pool.dataset.update', [existingDataset.id, payload as DatasetUpdate]);
    } else {
      // Unreachable — `isMissingEditRecord` keeps Save disabled until the edit load lands. An
      // erroring request$ rather than a `throw` (which `onFormSubmit` calls outside its try-less
      // subscribe, so it would escape to the global ErrorHandler) and rather than falling back to
      // create, which would file a stray dataset from an edit panel.
      request$ = throwError(() => new Error('Cannot save: the dataset being edited was not loaded.'));
    }

    return {
      request$: this.saveDataset(request$),
      // Owned by the form, not its openers, so every entry point confirms identically.
      successMessage: ([savedDataset, shouldGoToAclEditor]) => {
        // Accepting the ACL prompt navigates away; a toast about the dataset would land on a page
        // the user has already left.
        if (shouldGoToAclEditor) {
          return null;
        }
        return this.isNew()
          ? this.translate.instant('Dataset «{name}» created.', { name: getDatasetLabel(savedDataset) })
          : this.translate.instant('Dataset «{name}» updated.', { name: getDatasetLabel(savedDataset) });
      },
      onSuccess: ([savedDataset, shouldGoToAclEditor]) => this.onSaved(savedDataset, shouldGoToAclEditor),
      closeWith: ([savedDataset]) => savedDataset,
      // `<ix-form>`'s default handler maps errors against its own `[formGroup]`, which here is the
      // empty root — every field lives in a section's own group. Run the same handler over those
      // instead, so a duplicate name or an out-of-range quota lands on the control that caused it;
      // anything it can't place still falls back to an error modal inside the handler.
      onError: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.sectionForms());
        return true;
      },
    };
  };

  /** Runs the post-save chain: optional SMB/NFS shares, then the parent-ACL prompt. */
  private saveDataset(request$: Observable<Dataset>): Observable<SaveDatasetResult> {
    return request$.pipe(
      switchMap((dataset) => this.createSmb(dataset)),
      switchMap((dataset) => this.createNfs(dataset)),
      switchMap((dataset) => {
        return this.checkForAclOnParent().pipe(
          switchMap((isAcl): Observable<SaveDatasetResult> => {
            return combineLatest([of(dataset), isAcl ? this.aclDialog() : of(false)]);
          }),
        );
      }),
    );
  }

  private onSaved(savedDataset: Dataset, shouldGoToAclEditor: boolean): void {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (this.nameAndOptionsSection().canCreateSmb && datasetPresetFormValue.create_smb) {
      this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
    }
    if (this.nameAndOptionsSection().canCreateNfs && datasetPresetFormValue.create_nfs) {
      this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
    }

    this.aclEditorPath = shouldGoToAclEditor ? savedDataset.mountpoint : undefined;
  }

  /**
   * Forwards the `closeWith` payload to the opener, then navigates to the ACL editor if the
   * post-save prompt was accepted. In that branch the opener's `onSuccess` may never run — the host
   * resolves the payload on panel teardown, by which point `router.navigate` has destroyed the
   * opener. Intended: we're leaving the page anyway, and it matches the pre-migration behaviour.
   */
  protected onFormClosed(savedDataset: Dataset): void {
    this.closed.emit(savedDataset);

    if (this.aclEditorPath) {
      this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
        queryParams: { path: this.aclEditorPath },
      });
    }
  }

  private preparePayload(): DatasetCreate | DatasetUpdate {
    const sections = this.isNew() ? this.createSections : this.updateSections;

    return sections.reduce((payload, section) => {
      return { ...payload, ...section.getPayload() } as DatasetCreate | DatasetUpdate;
    }, {} as DatasetCreate | DatasetUpdate);
  }

  private checkForAclOnParent(): Observable<boolean> {
    const parentDataset = this.parentDataset();
    if (!parentDataset) {
      return of(false);
    }

    const parentPath = `/mnt/${parentDataset.id}`;
    return this.api.call('filesystem.stat', [parentPath]).pipe(map((stat) => stat.acl));
  }

  private aclDialog(): Observable<boolean> {
    return this.dialog.confirm({
      title: this.translate.instant(helptextDatasetForm.afterSubmitDialog.title),
      message: this.translate.instant(helptextDatasetForm.afterSubmitDialog.message),
      hideCheckbox: true,
      buttonText: this.translate.instant(helptextDatasetForm.afterSubmitDialog.actionBtn),
      cancelText: this.translate.instant(helptextDatasetForm.afterSubmitDialog.cancelBtn),
    });
  }

  private createSmb(dataset: Dataset): Observable<Dataset> {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (!this.isNew() || !datasetPresetFormValue.create_smb || !this.nameAndOptionsSection().canCreateSmb) {
      return of(dataset);
    }
    const isMultiprotocol = this.nameAndOptionsSection().form.value.share_type === DatasetPreset.Multiprotocol;
    return this.api.call('sharing.smb.create', [{
      name: datasetPresetFormValue.smb_name,
      path: `${mntPath}/${dataset.id}`,
      ...(isMultiprotocol ? { purpose: SmbSharePurpose.MultiProtocolShare } : {}),
    }]).pipe(
      switchMap(() => of(dataset)),
      catchError((error: unknown) => this.rollBack(dataset, error)),
    );
  }

  private createNfs(dataset: Dataset): Observable<Dataset> {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (!this.isNew() || !datasetPresetFormValue.create_nfs || !this.nameAndOptionsSection().canCreateNfs) {
      return of(dataset);
    }
    return this.api.call('sharing.nfs.create', [{
      path: `${mntPath}/${dataset.id}`,
    }]).pipe(
      switchMap(() => of(dataset)),
      catchError((error: unknown) => this.rollBack(dataset, error)),
    );
  }

  private rollBack(dataset: Dataset, error: unknown): Observable<Dataset> {
    return this.api.call('pool.dataset.delete', [dataset.id, { recursive: true, force: true }]).pipe(
      switchMap(() => {
        throw error;
      }),
    );
  }
}
