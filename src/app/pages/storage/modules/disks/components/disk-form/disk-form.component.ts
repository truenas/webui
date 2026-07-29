import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, input, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

export type DiskFormResponse = (DiskUpdate & { identifier: string })[];

@Component({
  selector: 'ix-disk-form',
  templateUrl: 'disk-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class DiskFormComponent extends SidePanelForm<DiskFormResponse> implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbarService = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DiskWrite];
  protected readonly InputType = InputType;

  /**
   * Disk to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Unused in the legacy SlideIn host (which supplies it via
   * `slideInRef.getData()`).
   */
  readonly diskToEdit = input<Disk | undefined>(undefined);

  protected readonly form = this.fb.group({
    name: [''],
    serial: [''],
    description: [''],
    hddstandby: [null as DiskStandby | null],
    advpowermgmt: [null as DiskPowerLevel | null],
    passwd: [''],
    clear_pw: [false],
  });

  protected readonly helptext = helptextDisks;
  protected readonly hddstandbyOptions = translateOptions(this.translate, helptextDisks.standbyOptions);
  protected readonly advpowermgmtOptions = translateOptions(
    this.translate,
    helptextDisks.advancedPowerManagementOptions,
  );

  readonly isLoading = signal<boolean>(false);
  private readonly existingDisk = signal<Disk | null>(null);

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly showSedSection = computed(() => {
    return this.isEnterprise() || (this.existingDisk()?.passwd && this.existingDisk()?.passwd !== '');
  });

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  ngOnInit(): void {
    const disk = this.slideInRef
      ? this.slideInRef.getData() as Disk
      : this.diskToEdit();
    if (disk) {
      this.setFormDisk(disk);
    }

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (state) => {
          const controlPasswd = this.form.controls.passwd;
          if (state) {
            // clear the password AND disable the form so as not to confuse users
            controlPasswd.setValue('');
            controlPasswd.markAsPristine();
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
    const diskId = this.existingDisk().identifier;
    const valuesDiskUpdate: DiskUpdate = this.prepareUpdate(this.form.value);

    this.isLoading.set(true);
    this.api.call('disk.update', [diskId, valuesDiskUpdate])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeWith([{
            identifier: diskId,
            ...valuesDiskUpdate,
          }]);
          this.snackbarService.success(this.translate.instant('Disk settings successfully saved.'));
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
