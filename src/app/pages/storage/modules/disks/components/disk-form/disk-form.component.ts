import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Role } from 'app/enums/role.enum';
import { translateOptions } from 'app/helpers/translate.helper';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-form',
  templateUrl: 'disk-form.component.html',
  styleUrls: ['disk-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    MatDivider,
    IxSelectComponent,
    IxCheckboxComponent,
    MatCardActions,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class DiskFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

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

  readonly helptext = helptextDisks;
  readonly title = helptextDisks.disk_form_title;
  readonly hddstandbyOptions$ = of(helptextDisks.disk_form_hddstandby_options);
  readonly advpowermgmtOptions$ = of(translateOptions(this.translate, this.helptext.disk_form_advpowermgmt_options));
  isLoading = false;
  existingDisk: Disk;

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: SlideInRef<DiskFormComponent, boolean>,
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
    this.form.controls.clear_pw.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(
        (state) => {
          const controlPasswd = this.form.controls.passwd;
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
          this.slideInRef.close(true);
          this.snackbarService.success(this.translate.instant('Disk settings successfully saved.'));
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
