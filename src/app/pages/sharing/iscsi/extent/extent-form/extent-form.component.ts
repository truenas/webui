import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
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
import { IscsiService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './extent-form.component.html',
  styleUrls: ['./extent-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtentFormComponent implements OnInit {
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
    filesize: [null as number],
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
  ) {}

  ngOnInit(): void {
    this.form.controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe((value: IscsiExtentType) => {
      if (value === IscsiExtentType.Disk) {
        this.form.controls.disk.enable();
        this.form.controls.path.disable();
        this.form.controls.filesize.disable();
      }
      if (value === IscsiExtentType.File) {
        this.form.controls.disk.disable();
        this.form.controls.path.enable();
        this.form.controls.filesize.enable();
      }
    });
  }

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

    if (values.type === IscsiExtentType.File) {
      if (+values.filesize !== 0) {
        values.filesize = +values.filesize + (values.blocksize - +values.filesize % values.blocksize);
      }
    }

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

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
