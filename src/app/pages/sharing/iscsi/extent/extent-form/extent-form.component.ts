import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { sortBy, startsWith } from 'lodash-es';
import {
  BehaviorSubject, combineLatest, Observable, of,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiExtent, IscsiExtentUpdate } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-extent-form',
  templateUrl: './extent-form.component.html',
  styleUrls: ['./extent-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxExplorerComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ExtentFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingExtent;
  }

  get isDevice(): boolean {
    return this.form.controls.type.value !== IscsiExtentType.File;
  }

  get isAvailableThreshold(): boolean {
    return startsWith(this.form.controls.disk.value, 'zvol');
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
    filesize: new FormControl(null as number | null),
    serial: [''],
    blocksize: [512],
    pblocksize: [false],
    avail_threshold: new FormControl(null as number | null, [Validators.min(1), Validators.max(99)]),
    insecure_tpc: [true],
    xen: [false],
    rpm: [IscsiExtentRpm.Ssd],
    ro: [false],
  });

  protected isLoading = signal(false);
  protected editingExtent: IscsiExtent | undefined;

  private extentDiskBeingEdited$ = new BehaviorSubject<Option | undefined>(undefined);

  readonly helptext = helptextSharingIscsi;

  protected readonly requiredRoles = [
    Role.SharingIscsiExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

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

      return sortBy(options, ['label']);
    }),
  );

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  constructor(
    protected iscsiService: IscsiService,
    protected formatter: IxFormatterService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private api: ApiService,
    private filesystemService: FilesystemService,
    public slideInRef: SlideInRef<IscsiExtent | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingExtent = this.slideInRef.getData();
  }

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
      this.setExtentForEdit(this.editingExtent);
    }
  }

  setExtentForEdit(extent: IscsiExtent): void {
    this.form.patchValue(extent);

    if (extent.type === IscsiExtentType.Disk) {
      this.setExtentDisk(extent);
    }
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
    } as IscsiExtentUpdate;

    if (values.type === IscsiExtentType.Disk) {
      values.path = values.disk;
    }

    if (values.type === IscsiExtentType.File && Number(values.filesize) !== 0) {
      values.filesize = Number(values.filesize) + (values.blocksize - Number(values.filesize) % values.blocksize);
    }

    this.isLoading.set(true);
    let request$: Observable<unknown>;
    if (this.editingExtent) {
      request$ = this.api.call('iscsi.extent.update', [
        this.editingExtent.id,
        values,
      ]);
    } else {
      request$ = this.api.call('iscsi.extent.create', [values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private setExtentDisk(extent: IscsiExtent): void {
    if (!startsWith(extent.path, 'zvol')) {
      return;
    }

    const extentDiskBeingEdited = extent.path.slice('zvol'.length + 1);
    this.extentDiskBeingEdited$.next({
      label: extentDiskBeingEdited,
      value: extent.path,
    });
    this.form.patchValue({
      disk: extent.path,
    });
  }
}
