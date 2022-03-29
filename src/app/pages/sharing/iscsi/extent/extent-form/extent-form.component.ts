import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IscsiService, StorageService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './extent-form.component.html',
  styleUrls: ['./extent-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtentFormComponent {
  get isNew(): boolean {
    return !this.editingExtent;
  }

  get isDevice(): boolean {
    return (this.form.controls.type.value !== IscsiExtentType.File);
  }

  get isAvailableThreshold(): boolean {
    return _.startsWith(this.form.controls.disk.value, 'zvol');
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Extent')
      : this.translate.instant('Edit Extent');
  }

  form = this.formBuilder.group({
    name: ['', Validators.required],
    comment: [''],
    enabled: [true],
    type: [IscsiExtentType.Disk],
    disk: [''],
    path: ['/mnt'],
    filesize: [''],
    serial: [''],
    blocksize: [512],
    pblocksize: [false],
    avail_threshold: [null as number, [Validators.min(1), Validators.max(99)]],
    insecure_tpc: [true],
    xen: [false],
    rpm: [IscsiExtentRpm.Ssd],
    ro: [false],
  });

  isLoading = false;

  readonly helptext = helptextSharingIscsi;

  readonly rpms$ = of(this.helptext.extent_form_enum_rpm);
  readonly types$ = of(this.helptext.extent_form_enum_type);
  readonly blocksizes$ = of(this.helptext.extent_form_enum_blocksize);
  readonly disks$ = this.iscsiService.getExtentDevices().pipe(
    map((devices) => {
      const opts = [];
      for (const i in devices) {
        opts.push({ label: devices[i], value: i });
      }
      return _.sortBy(opts, ['label']);
    }),
  );
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  private editingExtent: IscsiExtent;

  constructor(
    protected iscsiService: IscsiService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private filesystemService: FilesystemService,
    protected storageService: StorageService,
  ) {}

  setExtentForEdit(extent: IscsiExtent): void {
    if (extent.type === IscsiExtentType.Disk) {
      if (_.startsWith(extent.path, 'zvol')) {
        extent.disk = extent.path;
      }
      delete extent.path;
    }

    this.editingExtent = extent;
    this.form.patchValue(extent);
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
    };

    if (values.type === IscsiExtentType.Disk) {
      values.path = values.disk;
    }

    let originalFilesize = parseInt(values.filesize, 10);
    if (originalFilesize !== 0) {
      originalFilesize = originalFilesize + (values.blocksize - originalFilesize % values.blocksize);
    }

    values.filesize = originalFilesize.toString();

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.extent.create', [values]);
    } else {
      request$ = this.ws.call('iscsi.extent.update', [
        this.editingExtent.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.slideInService.close();
    }, (error) => {
      this.isLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
