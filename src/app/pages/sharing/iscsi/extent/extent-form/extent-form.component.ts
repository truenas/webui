import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
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
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
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
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

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

  readonly requiredRoles = [
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
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private filesystemService: FilesystemService,
    private slideInRef: SlideInRef<ExtentFormComponent>,
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
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private setExtentDisk(): void {
    if (!startsWith(this.editingExtent.path, 'zvol')) {
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
