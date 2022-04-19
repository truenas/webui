import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import helptext from 'app/helptext/storage/disks/disks';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { Disk, DiskUpdate } from 'app/interfaces/storage.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'app-disk-form',
  templateUrl: 'disk-form.component.html',
  styleUrls: ['disk-form.component.scss'],
})
export class DiskFormComponent implements OnInit {
  readonly editCall = 'disk.update' as const;
  customFilter: [[Partial<QueryFilter<Disk>>]] = [[['identifier', '=']]];
  form = this.fb.group({
    name: [''],
    serial: [''],
    description: [''],
    critical: [null as number, [Validators.min(0)]],
    difference: [null as number, [Validators.min(0)]],
    informational: [null as number, [Validators.min(0)]],
    hddstandby: [null as DiskStandby],
    advpowermgmt: [null as DiskPowerLevel],
    togglesmart: [false],
    smartoptions: [],
    passwd: [''],
    clear_pw: [false],
  });
  readonly helptext = helptext;
  readonly advpowermgmt_options: Option[] = helptext.disk_form_advpowermgmt_options;
  readonly hddstandbyOptions$ = of(helptext.disk_form_hddstandby_options);
  readonly advpowermgmtOptions$ = of(this.translateOptions(this.advpowermgmt_options));
  isLoading = false;
  title = helptext.disk_form_title;
  existingDisk: Disk;

  constructor(
    private translate: TranslateService,
    protected ws: WebSocketService,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideInService: IxSlideInService,
  ) {
  }

  ngOnInit(): void {
    this.passwordState();
  }

  setFormDisck(disk: Disk): void {
    this.existingDisk = disk;
    this.form.patchValue(this.resourceTransformIncomingRestData(disk));
  }

  private translateOptions(options: Option[]): Option[] {
    return options.map((el) => {
      return { label: this.translate.instant(el.label), value: el.value };
    });
  }

  resourceTransformIncomingRestData(data: Disk): Disk {
    const transformed = { ...data };
    delete transformed.passwd;
    return transformed;
  }

  private passwordState(): void {
    this.form.controls['clear_pw'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(
        (state) => {
          const controlPasswd = this.form.controls['passwd'];
          if (state) {
            controlPasswd.disable();
          } else {
            controlPasswd.enable();
          }
        },
      );
  }

  beforeSubmit(value: any): void {
    if (value.passwd === '') {
      delete value.passwd;
    }

    if (value.clear_pw) {
      value.passwd = '';
    }

    delete value.clear_pw;
    delete value.name;
    delete value.serial;

    value.critical = value.critical === '' ? null : value.critical;
    value.difference = value.difference === '' ? null : value.difference;
    value.informational = value.informational === '' ? null : value.informational;
  }

  onSubmit(): void {
    const values = this.form.value;

    this.beforeSubmit(values);
    this.isLoading = true;
    this.ws.call(this.editCall, [this.existingDisk.identifier, values as DiskUpdate])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();
          this.dialogService.info(helptext.dialog_title,
            helptext.dialog_msg_save_success, '350px', 'info', true);
        },
        (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      );
  }

  goBack(): void {
    this.slideInService.close();
  }
}
