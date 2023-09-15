import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

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
    path: [mntPath],
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

  private extentDiskBeingEdited$ = new BehaviorSubject<Option>(undefined);

  readonly helptext = helptextSharingIscsi;

  readonly rpms$ = of(this.helptext.extent_form_enum_rpm);
  readonly types$ = of(this.helptext.extent_form_enum_type);
  readonly blocksizes$ = of(this.helptext.extent_form_enum_blocksize);
  readonly disks$ = combineLatest([
    this.iscsiService.getExtentDevices().pipe(choicesToOptions()),
    this.extentDiskBeingEdited$,
  ]).pipe(
    map(([availableOptions, extentDiskBeingEdited]) => {
      const options = [...availableOptions];
      if (extentDiskBeingEdited) {
        options.push(extentDiskBeingEdited);
      }

      return _.sortBy(options, ['label']);
    }),
  );
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  constructor(
    protected iscsiService: IscsiService,
    protected formatter: IxFormatterService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private filesystemService: FilesystemService,
    private slideInRef: IxSlideInRef<ExtentFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingExtent: IscsiExtent,
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

    if (this.editingExtent) {
      this.setExtentForEdit();
    }
  }

  setExtentForEdit(): void {
    this.form.patchValue(this.editingExtent);

    if (this.editingExtent.type === IscsiExtentType.Disk) {
      this.setExtentDisk();
    }
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
    };

    if (values.type === IscsiExtentType.Disk) {
      values.path = values.disk;
    }

    if (values.type === IscsiExtentType.File && +values.filesize !== 0) {
      values.filesize = +values.filesize + (values.blocksize - +values.filesize % values.blocksize);
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
        this.slideInRef.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private setExtentDisk(): void {
    if (!_.startsWith(this.editingExtent.path, 'zvol')) {
      return;
    }

    const extentDiskBeingEdited = this.editingExtent.path.slice('zvol'.length + 1);
    this.extentDiskBeingEdited$.next({
      label: extentDiskBeingEdited,
      value: this.editingExtent.path,
    });
    this.form.patchValue({
      disk: this.editingExtent.path,
    });
  }
}
