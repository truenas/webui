import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { helptextScrubForm } from 'app/helptext/data-protection/scrub/scrub-form';
import { CloudBackupSnapshot, SnapshotIncludeExclude } from 'app/interfaces/cloud-backup.interface';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cloud-backup-restore-from-snapshot-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupRestoreFromSnapshotFormComponent implements OnInit {
  readonly requiredRoles = [Role.CloudBackupWrite];
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  includeExcludeOptions: Observable<RadioOption[]> = of([
    {
      label: this.translate.instant('Include everything'),
      value: SnapshotIncludeExclude.Include,
    },
    {
      label: this.translate.instant('Select paths to exclude'),
      value: SnapshotIncludeExclude.ExcludePaths,
    },
    {
      label: this.translate.instant('Exclude by pattern'),
      value: SnapshotIncludeExclude.ExcludeByPattern,
    },
  ]);

  get title(): string {
    return this.translate.instant('Restore from Snapshot');
  }

  form = this.fb.group({
    target: [null as string, Validators.required],
    includeExclude: [SnapshotIncludeExclude.Include, Validators.required],
    excludedPaths: [[] as string[], Validators.required],
    excludePattern: [null as string | null, Validators.required],
  });

  isLoading = false;

  createDatasetProps: Omit<DatasetCreate, 'name'> = {
    share_type: DatasetPreset.Smb,
  };

  readonly tooltips = {
    target: helptextScrubForm.scrub_volume_tooltip,
    includeExclude: helptextScrubForm.scrub_volume_tooltip,
    pattern: helptextScrubForm.scrub_volume_tooltip,
  };

  get isExcludePathsSelected(): boolean {
    return this.form.controls.includeExclude.value === SnapshotIncludeExclude.ExcludePaths;
  }

  get isExcludeByPatternSelected(): boolean {
    return this.form.controls.includeExclude.value === SnapshotIncludeExclude.ExcludeByPattern;
  }

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: IxSlideInRef<CloudBackupSnapshot>,
    private filesystemService: FilesystemService,
    @Inject(SLIDE_IN_DATA) public snapshot: CloudBackupSnapshot,
  ) {}

  ngOnInit(): void {
    this.form.controls.excludedPaths.disable();
    this.form.controls.excludePattern.disable();

    this.form.controls.includeExclude.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isExcludePathsSelected) {
          this.form.controls.excludedPaths.enable();
          this.form.controls.excludePattern.disable();
        } else if (this.isExcludeByPatternSelected) {
          this.form.controls.excludePattern.enable();
          this.form.controls.excludedPaths.disable();
        }
        this.cdr.markForCheck();
        this.form.updateValueAndValidity();
      },
    });
  }

  onSubmit(): void {
    this.isLoading = true;

    this.ws.call('cloud_backup.restore', [
      {
        snapshot_id: this.snapshot.id,
        target: this.form.value.target,
        exclude: (this.form.value.includeExclude === SnapshotIncludeExclude.ExcludePaths
          ? this.form.value.excludedPaths
          : this.form.value.excludePattern) || null,
      },
    ]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('Cloud Backup Restored Successfully'));
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
