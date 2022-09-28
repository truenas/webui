import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { translateOptions } from 'app/helpers/translate.helper';
import helptext from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/storage.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: 'disk-form.component.html',
  styleUrls: ['disk-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskFormComponent implements OnInit {
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
    smartoptions: [''],
    passwd: [''],
    clear_pw: [false],
  });
  readonly helptext = helptext;
  readonly title = helptext.disk_form_title;
  readonly hddstandbyOptions$ = of(helptext.disk_form_hddstandby_options);
  readonly advpowermgmtOptions$ = of(translateOptions(this.translate, this.helptext.disk_form_advpowermgmt_options));
  isLoading = false;
  existingDisk: Disk;

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideInService: IxSlideInService,
    private snackbarService: SnackbarService,
  ) {
  }

  ngOnInit(): void {
    this.clearPasswordField();
  }

  setFormDisk(disk: Disk): void {
    this.existingDisk = disk;
    this.form.patchValue({ ...disk });
  }

  private clearPasswordField(): void {
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

  prepareUpdate(value: DiskFormComponent['form']['value']): DiskUpdate {
    const transformedValue = {
      ...value,
      critical: !value.critical ? null : Number(value.critical),
      difference: !value.difference ? null : Number(value.difference),
      informational: !value.informational ? null : Number(value.informational),
    };

    if (transformedValue.passwd === '') {
      delete transformedValue.passwd;
    }

    if (transformedValue.clear_pw) {
      transformedValue.passwd = '';
    }

    delete transformedValue.clear_pw;
    delete transformedValue.name;
    delete transformedValue.serial;

    return transformedValue;
  }

  onSubmit(): void {
    const valuesDiskUpdate: DiskUpdate = this.prepareUpdate(this.form.value);

    this.isLoading = true;
    this.ws.call('disk.update', [this.existingDisk.identifier, valuesDiskUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close(null, true);
          this.snackbarService.success(this.translate.instant('Disk settings successfully saved.'));
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
