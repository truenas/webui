import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, output, OnInit, signal, viewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnRadioComponent,
} from '@truenas/ui-components';
import { defaultIfEmpty, map } from 'rxjs';
import { datasetsRootNode, slashRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextTruecloudBackup } from 'app/helptext/data-protection/truecloud-backup/cloudsync';
import {
  CloudBackup,
  CloudBackupRestoreParams,
  CloudBackupSnapshot,
  CloudBackupSnapshotDirectoryFileType,
  SnapshotIncludeExclude,
  snapshotIncludeExcludeOptions,
} from 'app/interfaces/cloud-backup.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { validateNotPoolRoot } from 'app/modules/forms/ix-forms/validators/validators';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-cloud-backup-restore-from-snapshot-form',
  templateUrl: './cloud-backup-restore-from-snapshot-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnRadioComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    TranslateModule,
    FormatDateTimePipe,
  ],
})
export class CloudBackupRestoreFromSnapshotFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(FormErrorHandlerService);
  private filesystemService = inject(FilesystemService);
  private dialogService = inject(DialogService);
  // Optional: present only in the legacy SlideIn host. Absent when hosted in the
  // `<tn-side-panel>` form panel, where data arrives via {@link restoreData}.
  private slideInRef = inject<SlideInRef<{
    backup: CloudBackup;
    snapshot: CloudBackupSnapshot;
  }, boolean>>(SlideInRef, { optional: true });

  private destroyRef = inject(DestroyRef);

  /**
   * The backup + snapshot to restore, supplied by the `<tn-side-panel>` host (via
   * {@link FormSidePanelService} `inputs`). The legacy SlideIn host passes the same shape through
   * `slideInRef.getData()`; {@link ngOnInit} resolves from whichever host is present.
   */
  readonly restoreData = input<{ backup: CloudBackup; snapshot: CloudBackupSnapshot } | undefined>(undefined);

  // This form hosts `<ix-form>` directly and forwards its submit()/canSubmit()/isBusy()/closed, so it
  // follows the ix-form dual-host recipe rather than extending `SidePanelForm`.
  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (forwarded from `<ix-form>`). */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  protected readonly requiredRoles = [Role.CloudBackupWrite];
  readonly mntPath = mntPath;
  readonly helptext = helptextTruecloudBackup;

  protected data: { backup: CloudBackup; snapshot: CloudBackupSnapshot };

  fileNodeProvider: TreeNodeProvider;
  snapshotNodeProvider: TreeNodeProvider;

  protected readonly includeExcludeOptions = mapToOptions(snapshotIncludeExcludeOptions, this.translate);

  form = this.fb.group({
    target: [null as string | null, [
      Validators.required,
      validateNotPoolRoot(this.translate.instant(helptextTruecloudBackup.targetPoolRootError)),
    ]],
    includeExclude: [SnapshotIncludeExclude.IncludeEverything, Validators.required],
    excludedPaths: [[] as string[], Validators.required],
    excludePattern: [null as string | null, Validators.required],
    subFolder: [''],
    includedPaths: [[] as string[]],
  });

  protected readonly includedPathsRootNodes = signal<ExplorerNodeData[]>([]);

  protected readonly rootDatasetNode: ExplorerNodeData = datasetsRootNode;
  protected readonly slashRootNode: ExplorerNodeData = slashRootNode;

  get backupMntPath(): string {
    return this.data.backup.absolute_paths ? this.data.backup.path : '/';
  }

  get isExcludePathsSelected(): boolean {
    return this.form.controls.includeExclude.value === SnapshotIncludeExclude.ExcludePaths;
  }

  get isExcludeByPatternSelected(): boolean {
    return this.form.controls.includeExclude.value === SnapshotIncludeExclude.ExcludeByPattern;
  }

  get isIncludeFromSubfolderSelected(): boolean {
    return this.form.controls.includeExclude.value === SnapshotIncludeExclude.IncludeFromSubFolder;
  }

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }

  /** Whether the form may be submitted right now; the `<tn-side-panel>` host reads this for its Save action. */
  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /** Whether the form is currently submitting; the host shows a progress bar while true. */
  isBusy(): boolean {
    return this.ixForm()?.isLoading() ?? false;
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  ngOnInit(): void {
    // Resolve from whichever host opened the form: the legacy SlideIn (`getData()`) or the
    // `<tn-side-panel>` (the `restoreData` input, set before this hook runs).
    this.data = this.slideInRef?.getData() ?? this.restoreData();

    this.form.patchValue({
      subFolder: this.backupMntPath,
    });
    this.updateIncludedPathsRootNodes();

    this.setFileNodeProvider();
    this.setSnapshotNodeProvider();
    this.disableHiddenFields();
    this.listenForFormChanges();
  }

  protected handleSubmit = (): SubmitResult => {
    const params = this.prepareParams();

    return {
      // `canMinimize` job dialogs complete without emitting (next never fires), so map the empty
      // completion to a value for ix-form's next-based success/close handling.
      request$: this.dialogService.jobDialog(
        this.api.job('cloud_backup.restore', params),
        {
          title: this.translate.instant('Restoring backup'),
          canMinimize: true,
        },
      ).afterClosed().pipe(defaultIfEmpty(true)),
      successMessage: this.translate.instant('Cloud Backup Restored Successfully'),
      onError: (error: unknown): boolean => {
        this.errorHandler.handleValidationErrors(error, this.form);
        return true;
      },
    };
  };

  private getSnapshotNodeProvider(): TreeNodeProvider {
    return (node: TreeNode<ExplorerNodeData>) => {
      return this.api.call(
        'cloud_backup.list_snapshot_directory',
        [this.data.backup.id, this.data.snapshot?.id, node.data.path],
      ).pipe(
        map((listing) => {
          const nodes: ExplorerNodeData[] = [];

          listing.forEach((file) => {
            if (file.type === CloudBackupSnapshotDirectoryFileType.Dir && file.path !== node.data.path) {
              nodes.push({
                path: file.path,
                name: file.name,
                type: ExplorerNodeType.Directory,
                hasChildren: true,
              });
            }
          });

          return nodes;
        }),
      );
    };
  }

  private prepareParams(): CloudBackupRestoreParams {
    const subfolder = this.isIncludeFromSubfolderSelected ? this.form.controls.subFolder.value : this.backupMntPath;

    const options = {
      exclude: this.isExcludeByPatternSelected
        ? [this.form.controls.excludePattern.value]
        : this.form.controls.excludedPaths.value.map((path) => path.replace(subfolder, '') || '/'),
      include: this.isIncludeFromSubfolderSelected
        ? this.form.getRawValue().includedPaths.map((path) => path.replace(subfolder, '') || '/')
        : null,
    };

    if (!options.exclude?.length) delete options.exclude;
    if (!options.include?.length) delete options.include;

    return [
      this.data.backup.id,
      this.data.snapshot.id,
      subfolder,
      this.form.controls.target.value,
      options,
    ];
  }

  private listenForFormChanges(): void {
    this.form.controls.includeExclude.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.disableHiddenFields();

        if (this.isExcludePathsSelected) {
          this.form.controls.excludedPaths.enable();
        } else if (this.isExcludeByPatternSelected) {
          this.form.controls.excludePattern.enable();
        } else if (this.isIncludeFromSubfolderSelected) {
          this.form.controls.subFolder.enable();
          this.form.controls.includedPaths.enable();
        }

        this.cdr.markForCheck();
        this.form.updateValueAndValidity();
      },
    });

    this.form.controls.subFolder.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.form.controls.includedPaths.setValue([]);
        this.updateIncludedPathsRootNodes();
      },
    });
  }

  private setFileNodeProvider(): void {
    this.fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  }

  private setSnapshotNodeProvider(): void {
    this.snapshotNodeProvider = this.getSnapshotNodeProvider();
  }

  private disableHiddenFields(): void {
    this.form.controls.excludePattern.disable();
    this.form.controls.excludedPaths.disable();
    this.form.controls.includedPaths.disable();
    this.form.controls.subFolder.disable();
  }

  private updateIncludedPathsRootNodes(): void {
    const subfolderValue = this.form.controls.subFolder.value;
    const rootNodes = subfolderValue
      ? [{ ...this.slashRootNode, path: subfolderValue, name: subfolderValue }]
      : [{ ...this.slashRootNode, path: this.backupMntPath, name: this.backupMntPath }];
    this.includedPathsRootNodes.set(rootNodes);
  }
}
