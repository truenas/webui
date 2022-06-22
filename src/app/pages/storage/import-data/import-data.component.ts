import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { merge, of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { ImportDiskFilesystem } from 'app/enums/import-disk-filesystem-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { singleArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/import-disk/import-disk';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { JobService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  templateUrl: './import-data.component.html',
  styleUrls: ['./import-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDataComponent implements OnInit {
  form = this.formBuilder.group({
    volume: [''],
    type: [null as ImportDiskFilesystem, Validators.required],
    msdosfs_locale: [''],
    destination: ['/mnt'],
  });

  lastJob: Job;

  readonly filesystemTypes$ = of([
    { label: 'UFS', value: ImportDiskFilesystem.Ufs },
    { label: 'NTFS', value: ImportDiskFilesystem.Ntfs },
    { label: 'MSDOSFS', value: ImportDiskFilesystem.Msdosfs },
    { label: 'EXT2FS', value: ImportDiskFilesystem.Ext2fs },
  ]);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  readonly msdosfsLocales$ = this.ws.call('pool.import_disk_msdosfs_locales').pipe(singleArrayToOptions());

  readonly volumes$ = this.ws.call('disk.get_unused', [true]).pipe(map((disks) => {
    return disks.reduce((options, disk) => {
      if (!disk.partitions?.length) {
        return options;
      }

      const diskVolumes = disk.partitions.map((partition) => ({ label: partition.path, value: partition.path }));
      return [...options, ...diskVolumes];
    }, [] as Option[]);
  }));

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private filesystemService: FilesystemService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private jobService: JobService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isMsdosfs(): boolean {
    return this.form.value.type === ImportDiskFilesystem.Msdosfs;
  }

  get canViewImportLog(): boolean {
    return Boolean(this.lastJob);
  }

  ngOnInit(): void {
    this.detectTypeOnVolumeSelection();
  }

  onSubmit(): void {
    const values = this.form.value;
    const localeOptions = this.isMsdosfs && values.msdosfs_locale
      ? { locale: values.msdosfs_locale }
      : {};

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: this.translate.instant('Importing Disk') },
    });
    dialogRef.componentInstance.setDescription(this.translate.instant('Importing Disk...'));
    dialogRef.componentInstance.setCall(
      'pool.import_disk',
      [values.volume, values.type, localeOptions, values.destination],
    );
    dialogRef.componentInstance.submit();
    merge(
      dialogRef.componentInstance.success,
      dialogRef.componentInstance.aborted,
    )
      .pipe(untilDestroyed(this))
      .subscribe((job) => {
        dialogRef.close();
        this.lastJob = job;
        this.cdr.markForCheck();
        this.viewImportLog();
      });
  }

  viewImportLog(): void {
    let title = this.translate.instant('Logs');
    if (this.lastJob.state === JobState.Success) {
      title = this.translate.instant('Disk Imported: Log Summary');
    } else if (this.lastJob.state === JobState.Aborted) {
      title = this.translate.instant('Disk Import Aborted: Log Summary');
    }

    this.jobService.showLogs(this.lastJob, title);
  }

  private detectTypeOnVolumeSelection(): void {
    this.form.controls['volume'].valueChanges
      .pipe(
        filter((volume) => Boolean(volume)),
        switchMap((volume) => {
          return this.ws.call('pool.import_disk_autodetect_fs_type', [volume]).pipe(
            catchError(() => of(null)),
            filter((type) => Boolean(type)),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe((type) => {
        this.form.patchValue({ type });
      });
  }
}
