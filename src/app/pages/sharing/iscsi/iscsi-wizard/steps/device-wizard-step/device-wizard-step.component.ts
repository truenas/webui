import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, switchMap } from 'rxjs';
import { IscsiExtentType, IscsiExtentUsefor, IscsiNewOption } from 'app/enums/iscsi.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
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
  @Input() form: IscsiWizardComponent['form']['controls']['device'];

  readonly helptextSharingIscsi = helptextSharingIscsi;
  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly typeOptions$ = of([
    { label: 'Device', value: IscsiExtentType.Disk },
    { label: 'File', value: IscsiExtentType.File },
  ]);

  readonly useforOptions$ = of([
    { label: 'VMware: Extent block size 512b, TPC enabled, no Xen compat mode, SSD speed', value: IscsiExtentUsefor.Vmware },
    { label: 'Xen: Extent block size 512b, TPC enabled, Xen compat mode enabled, SSD speed', value: IscsiExtentUsefor.Xen },
    { label: 'Legacy OS: Extent block size 512b, TPC enabled, no Xen compat mode, SSD speed', value: IscsiExtentUsefor.Legacyos },
    { label: 'Modern OS: Extent block size 4k, TPC enabled, no Xen compat mode, SSD speed', value: IscsiExtentUsefor.Modernos },
  ]);

  readonly diskOptions$ = this.iscsiService.getExtentDevices()
    .pipe(
      choicesToOptions(),
      switchMap((options) => of([...options, { label: 'Create New', value: IscsiNewOption.New }])),
      untilDestroyed(this),
    );

  readonly targetOptions$ = this.iscsiService.getTargets()
    .pipe(
      idNameArrayToOptions(),
      switchMap((options) => of([...options, { label: 'Create New', value: IscsiNewOption.New }])),
      untilDestroyed(this),
    );

  get isDevice(): boolean {
    return (this.form.controls.type.value !== IscsiExtentType.File);
  }

  get isNewZvol(): boolean {
    return this.form.enabled && this.form.value.disk === IscsiNewOption.New;
  }

  constructor(
    private iscsiService: IscsiService,
    private filesystemService: FilesystemService,
    public formatter: IxFormatterService,
  ) {}

  ngOnInit(): void {
    this.form.controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      if (type === IscsiExtentType.Disk) {
        this.form.controls.disk.enable();
        this.form.controls.path.disable();
        this.form.controls.filesize.disable();
      }
      if (type === IscsiExtentType.File) {
        this.form.controls.disk.disable();
        this.form.controls.path.enable();
        this.form.controls.filesize.enable();
        this.form.controls.dataset.disable();
        this.form.controls.volsize.disable();
      }
    });

    this.form.controls.disk.valueChanges.pipe(untilDestroyed(this)).subscribe((zvol) => {
      if (zvol === IscsiNewOption.New) {
        this.form.controls.dataset.enable();
        this.form.controls.volsize.enable();
      } else {
        this.form.controls.dataset.disable();
        this.form.controls.volsize.disable();
      }
    });
  }
}
