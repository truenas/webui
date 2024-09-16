import {
  ChangeDetectionStrategy, Component, computed, input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of, switchMap } from 'rxjs';
import { IscsiExtentType, iscsiExtentUseforMap } from 'app/enums/iscsi.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { newOption } from 'app/interfaces/option.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-device-wizard-step',
  templateUrl: './device-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceWizardStepComponent implements OnInit {
  readonly form = input<IscsiWizardComponent['form']['controls']['device']>();

  readonly helptextSharingIscsi = helptextSharingIscsi;
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
        ...options,
        { label: this.translate.instant('Create New'), value: newOption },
      ])),
    );

  readonly targetOptions$ = this.iscsiService.getTargets()
    .pipe(
      idNameArrayToOptions(),
      switchMap((options) => of([
        ...options,
        { label: this.translate.instant('Create New'), value: newOption },
      ])),
    );

  readonly isDevice = computed<boolean>(() => {
    return (this.form().controls.type.value !== IscsiExtentType.File);
  });

  readonly isNewZvol = computed<boolean>(() => {
    const form = this.form();
    return form.enabled && form.value.disk === newOption;
  });

  constructor(
    private iscsiService: IscsiService,
    private filesystemService: FilesystemService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
  ) {}

  ngOnInit(): void {
    this.form().controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
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

    this.form().controls.disk.valueChanges.pipe(untilDestroyed(this)).subscribe((zvol) => {
      if (zvol === newOption) {
        this.form().controls.dataset.enable();
        this.form().controls.volsize.enable();
      } else {
        this.form().controls.dataset.disable();
        this.form().controls.volsize.disable();
      }
    });
  }
}
