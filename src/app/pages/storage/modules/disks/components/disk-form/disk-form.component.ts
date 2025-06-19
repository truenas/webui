import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Role } from 'app/enums/role.enum';
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
import { TranslateOptionsPipe } from 'app/modules/translate/translate-options/translate-options.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-disk-form',
  templateUrl: 'disk-form.component.html',
  styleUrls: ['disk-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TranslateOptionsPipe,
  ],
})
export class DiskFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.DiskWrite];

  form = this.fb.group({
    name: [''],
    serial: [''],
    description: [''],
    hddstandby: [null as DiskStandby | null],
    advpowermgmt: [null as DiskPowerLevel | null],
    passwd: [''],
    clear_pw: [false],
  });

  readonly helptext = helptextDisks;
  readonly hddstandbyOptions$ = of(helptextDisks.standbyOptions);
  readonly advpowermgmtOptions$ = of(helptextDisks.advancedPowerManagementOptions);
  readonly isLoading = signal<boolean>(false);
  readonly existingDisk = signal<Disk | null>(null);

  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  readonly showSedSection = computed(() => {
    return this.isEnterprise() || (this.existingDisk()?.passwd && this.existingDisk()?.passwd !== '');
  });

  constructor(
    private store$: Store<AppState>,
    private translate: TranslateService,
    private api: ApiService,
    private fb: NonNullableFormBuilder,
    private errorHandler: FormErrorHandlerService,
    private snackbarService: SnackbarService,
    public slideInRef: SlideInRef<Disk, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.setFormDisk(this.slideInRef.getData());
  }

  ngOnInit(): void {
    if (this.showSedSection()) {
      this.clearPasswordField();
    }
  }

  private setFormDisk(disk: Disk): void {
    this.existingDisk.set(disk);
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

  private prepareUpdate(value: DiskFormComponent['form']['value']): DiskUpdate {
    const transformedValue = { ...value };

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

  protected onSubmit(): void {
    const valuesDiskUpdate: DiskUpdate = this.prepareUpdate(this.form.value);

    this.isLoading.set(true);
    this.api.call('disk.update', [this.existingDisk().identifier, valuesDiskUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.slideInRef.close({ response: true });
          this.snackbarService.success(this.translate.instant('Disk settings successfully saved.'));
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
