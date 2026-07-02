import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, inject, input, output, viewChild, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnIconComponent,
  TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import { sortBy, startsWith } from 'lodash-es';
import {
  BehaviorSubject, combineLatest, Observable, of,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiExtent, IscsiExtentUpdate } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { TranslateOptionsPipe } from 'app/modules/translate/translate-options/translate-options.pipe';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-extent-form',
  templateUrl: './extent-form.component.html',
  styleUrls: ['./extent-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    IxInputComponent,
    IxExplorerComponent,
    TnIconComponent,
    TranslateModule,
    TranslateOptionsPipe,
    ExplorerCreateDatasetComponent,
    AsyncPipe,
  ],
})
export class ExtentFormComponent implements OnInit {
  protected iscsiService = inject(IscsiService);
  protected formatter = inject(IxFormatterService);
  private translate = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private filesystemService = inject(FilesystemService);
  private destroyRef = inject(DestroyRef);

  /** Edit data supplied by the `<tn-side-panel>` host. */
  readonly extentData = input<IscsiExtent | undefined>(undefined);

  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (forwarded from `<ix-form>`). */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  protected readonly InputType = InputType;

  get isNew(): boolean {
    return !this.editingExtent;
  }

  get isDevice(): boolean {
    return this.form.controls.type.value !== IscsiExtentType.File;
  }

  get isAvailableThreshold(): boolean {
    return startsWith(this.form.controls.disk.value, 'zvol');
  }

  get isSnapshot(): boolean {
    const diskValue = this.form.controls.disk.value;
    return this.isDevice && !!diskValue && diskValue.includes('@');
  }

  form = this.formBuilder.group({
    name: ['', Validators.required],
    comment: [''],
    enabled: [true],
    type: [IscsiExtentType.Disk],
    disk: [''],
    path: [mntPath],
    filesize: new FormControl(null as number | null),
    serial: [''],
    product_id: [''],
    blocksize: [512],
    pblocksize: [false],
    avail_threshold: new FormControl(null as number | null, [Validators.min(1), Validators.max(99)]),
    insecure_tpc: [true],
    xen: [false],
    rpm: [IscsiExtentRpm.Ssd],
    ro: [false],
  });

  protected editingExtent: IscsiExtent | undefined;

  private extentDiskBeingEdited$ = new BehaviorSubject<Option | undefined>(undefined);

  readonly helptext = helptextIscsi;

  protected readonly requiredRoles = [
    Role.SharingIscsiExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  readonly rpms$ = of(this.helptext.extent.rpmOptions);
  readonly types$ = of(this.helptext.extent.typeOptions);
  readonly blocksizes$ = of(this.helptext.extent.blocksizeOptions);
  readonly disks$ = combineLatest([
    this.iscsiService.getExtentDevices().pipe(choicesToOptions()),
    this.extentDiskBeingEdited$,
  ]).pipe(
    map(([availableOptions, extentDiskBeingEdited]) => {
      const options = [...availableOptions];
      if (extentDiskBeingEdited) {
        options.push(extentDiskBeingEdited);
      }

      return sortBy(options, ['label']);
    }),
  );

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  /** Whether the form may be submitted right now. Delegates to the inner `<ix-form>`. */
  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }

  ngOnInit(): void {
    // Edit data arrives via the `extentData` input from the side-panel host.
    this.editingExtent = this.extentData();

    this.form.controls.type.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value: IscsiExtentType) => {
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

    // Handle snapshot selection - auto-set ro=true and disable checkbox
    this.form.controls.disk.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((diskValue: string) => {
      if (diskValue?.includes('@')) {
        // Snapshot selected - must be read-only
        this.form.controls.ro.setValue(true);
        this.form.controls.ro.disable();
      } else {
        // Regular device - allow ro to be toggled
        this.form.controls.ro.enable();
      }
    });

    if (this.editingExtent) {
      this.setExtentForEdit(this.editingExtent);
    }
  }

  private setExtentForEdit(extent: IscsiExtent): void {
    this.form.patchValue(extent);

    if (extent.type === IscsiExtentType.Disk) {
      this.setExtentDisk(extent);
    }
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    // Use getRawValue to include disabled fields like 'ro' when a snapshot is selected
    const values = {
      ...this.form.getRawValue(),
    } as IscsiExtentUpdate;

    if (values.type === IscsiExtentType.Disk) {
      values.path = values.disk;
      delete values.filesize;
    } else {
      delete values.disk;
    }

    if (values.type === IscsiExtentType.File && Number(values.filesize) !== 0) {
      values.filesize = Number(values.filesize) + (values.blocksize - Number(values.filesize) % values.blocksize);
    }

    if (values.product_id === '') {
      values.product_id = null;
    }

    const request$: Observable<unknown> = this.editingExtent
      ? this.api.call('iscsi.extent.update', [this.editingExtent.id, values])
      : this.api.call('iscsi.extent.create', [values]);

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('Extent added')
        : this.translate.instant('Extent updated'),
    };
  };

  private setExtentDisk(extent: IscsiExtent): void {
    if (!startsWith(extent.path, 'zvol')) {
      return;
    }

    const extentDiskBeingEdited = extent.path.slice('zvol'.length + 1);
    this.extentDiskBeingEdited$.next({
      label: ignoreTranslation(extentDiskBeingEdited),
      value: extent.path,
    });
    this.form.patchValue({
      disk: extent.path,
    });
  }
}
