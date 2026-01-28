import {
  ChangeDetectionStrategy, Component, input, OnInit, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { of, switchMap } from 'rxjs';
import { IscsiExtentType, iscsiExtentUseforMap } from 'app/enums/iscsi.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextIscsi } from 'app/helptext/sharing';
import { newOption } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-extent-wizard-step',
  templateUrl: './extent-wizard-step.component.html',
  styleUrls: ['./extent-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    IxExplorerComponent,
    TnIconComponent,
    IxCheckboxComponent,
    TranslateModule,
    ExplorerCreateDatasetComponent,
  ],
})
export class ExtentWizardStepComponent implements OnInit {
  private iscsiService = inject(IscsiService);
  private filesystemService = inject(FilesystemService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  formatter = inject(IxFormatterService);

  readonly form = input.required<IscsiWizardComponent['form']['controls']['extent']>();

  readonly helptextSharingIscsi = helptextIscsi;
  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly typeOptions$ = of([
    { label: this.translate.instant('Device'), value: IscsiExtentType.Disk },
    { label: this.translate.instant('File'), value: IscsiExtentType.File },
  ]);

  readonly useforOptions$ = of(mapToOptions(iscsiExtentUseforMap, this.translate));

  readonly diskOptions$ = this.iscsiService.getExtentDevices()
    .pipe(
      choicesToOptions(),
      switchMap((options) => of([
        { label: this.translate.instant('Create New'), value: newOption },
        ...options,
      ])),
    );

  get isDevice(): boolean {
    return this.form().controls.type.value !== IscsiExtentType.File;
  }

  get isNewZvol(): boolean {
    return this.form().enabled && this.form().value.disk === newOption;
  }

  get isSnapshot(): boolean {
    const diskValue = this.form().value.disk;
    return this.isDevice && !!diskValue && diskValue !== newOption && diskValue.includes('@');
  }

  ngOnInit(): void {
    this.form().controls.type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => {
      if (type === IscsiExtentType.Disk) {
        this.form().controls.disk.enable();
        this.form().controls.path.disable();
        this.form().controls.filesize.disable();
      }
      if (type === IscsiExtentType.File) {
        this.form().controls.disk.disable();
        this.form().controls.path.enable();
        this.form().controls.filesize.enable();
        this.form().controls.dataset.disable();
        this.form().controls.volsize.disable();
      }
    });

    this.form().controls.disk.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((diskValue) => {
      // Handle dataset/volsize for "Create New" zvol
      if (diskValue === newOption) {
        this.form().controls.dataset.enable();
        this.form().controls.volsize.enable();
      } else {
        this.form().controls.dataset.disable();
        this.form().controls.volsize.disable();
      }

      // Handle snapshot selection - auto-set ro=true and disable checkbox
      if (diskValue?.includes('@')) {
        this.form().controls.ro.setValue(true);
        this.form().controls.ro.disable();
      } else if (diskValue !== newOption) {
        this.form().controls.ro.enable();
      }
    });
  }
}
