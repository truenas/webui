import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of, first, map, forkJoin, repeat } from 'rxjs';
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
export class DiskFormComponent {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbarService = inject(SnackbarService);

  private submitRetries = 3;
  private submitRetryDelay = 2000;

  slideInRef = inject<SlideInRef<Disk, boolean>>(SlideInRef);

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

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.setFormDisk(this.slideInRef.getData());
    this.clearPasswordField();
  }

  private setFormDisk(disk: Disk): void {
    this.existingDisk.set(disk);
    this.form.patchValue({ ...disk });
  }

  /**
   * setup subscription to clear and disable the SED password field
   * when the `clear_pw` control is checked; when it's unchecked, the subscription enables the field.
   */
  private clearPasswordField(): void {
    this.form.controls.clear_pw.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(
        (state) => {
          const controlPasswd = this.form.controls.passwd;
          if (state) {
            controlPasswd.reset();
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

    // first, we call `disk.update` to send off the form values to the API and have it update the disk for us.
    const diskUpdate$ = this.api.call('disk.update', [this.existingDisk().identifier, valuesDiskUpdate]);

    // then, we call `disk.query` repeatedly until we get a response *matching* the updated disk.
    // we do this because `disk.update` returns immediately, but may not have finished updating the disk.
    const diskQuery$ = this.api.call('disk.query', [[['identifier', '=', this.existingDisk().identifier]], { extra: { passwords: true } }]).pipe(
      map((disks) => disks.at(0)),
      repeat({
        count: this.submitRetries,
        delay: this.submitRetryDelay,
      }),
      first((disk: Disk) => {
        // type assertion here is safe since `DiskUpdate` is a strict subtype of `Disk`
        const keys = Object.keys(valuesDiskUpdate) as (keyof DiskUpdate)[];
        for (const key of keys) {
          if (disk[key] !== valuesDiskUpdate[key]) {
            return false;
          }
        }

        return true;
      }),
    );

    this.isLoading.set(true);
    forkJoin([diskUpdate$, diskQuery$])
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
