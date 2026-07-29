import { ChangeDetectionStrategy, Component, DestroyRef, computed, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
  type TnSelectOption,
} from '@truenas/ui-components';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import {
  IxFormHostForm,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

export type DiskFormResponse = (DiskUpdate & { identifier: string })[];

/**
 * `tn-select` derives an option's test id from a primitive `value` before falling back to the
 * label, which would collapse `option-advpowermgmt-level-127-…` down to `option-advpowermgmt-127`.
 * The legacy `ix-select` ids were label-derived, so pin the extractor to keep them byte-stable.
 * Shared with the bulk-edit form, which renders the same option list.
 */
export const advPowerManagementOptionTestId = (option: TnSelectOption<DiskPowerLevel>): string => option.label;

interface DiskFormValues {
  name: string;
  serial: string;
  description: string;
  hddstandby: DiskStandby | null;
  advpowermgmt: DiskPowerLevel | null;
  passwd: string;
  clear_pw: boolean;
}

@Component({
  selector: 'ix-disk-form',
  templateUrl: 'disk-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class DiskFormComponent extends IxFormHostForm<DiskFormResponse | null> implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);

  /** The disk being edited, supplied by the `<tn-side-panel>` host before `ngOnInit`. */
  readonly diskToEdit = input.required<Disk>();

  protected readonly requiredRoles = [Role.DiskWrite];
  protected readonly InputType = InputType;

  protected form = this.fb.group({
    name: [''],
    serial: [''],
    description: [''],
    // `Validators.required` is added in `ngOnInit`, per field — see `isHddStandbyRequired`.
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

  protected readonly optionLabelTestId = advPowerManagementOptionTestId;

  /**
   * A disk normally always has a power-management value, so the field is marked required and
   * backed by a validator rather than leaving Save always enabled. Only when the disk actually
   * arrived with a value, though: requiring one that came back empty would leave Save
   * permanently disabled — blocking an edit to the description, say — on a field the user
   * never touched and got no explanation about.
   */
  protected readonly isHddStandbyRequired = computed(() => Boolean(this.diskToEdit()?.hddstandby));
  protected readonly isAdvPowerManagementRequired = computed(() => Boolean(this.diskToEdit()?.advpowermgmt));

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly showSedSection = computed(() => {
    const disk = this.diskToEdit();
    return this.isEnterprise() || (!!disk?.passwd && disk.passwd !== '');
  });

  // Captured on a successful save so the panel host can hand the updated disk back to its
  // opener: `<ix-form>` emits a bare `true` in the side-panel host, dropping the payload.
  private submittedResponse: DiskFormResponse | null = null;

  ngOnInit(): void {
    if (this.isHddStandbyRequired()) {
      this.form.controls.hddstandby.addValidators(Validators.required);
    }
    if (this.isAdvPowerManagementRequired()) {
      this.form.controls.advpowermgmt.addValidators(Validators.required);
    }

    if (this.showSedSection()) {
      this.clearPasswordField();
    }
  }

  protected readonly handleSubmit = (event: FormSubmitEvent<DiskFormValues>): SubmitResult => {
    const diskId = this.diskToEdit().identifier;
    const valuesDiskUpdate = this.prepareUpdate(event.allValues);

    return {
      request$: this.api.call('disk.update', [diskId, valuesDiskUpdate]),
      successMessage: this.translate.instant('Disk settings successfully saved.'),
      onSuccess: () => {
        this.submittedResponse = [{ identifier: diskId, ...valuesDiskUpdate }];
      },
    };
  };

  protected onFormClosed(): void {
    this.closed.emit(this.submittedResponse);
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

  private prepareUpdate(value: DiskFormValues): DiskUpdate {
    const transformedValue: Partial<DiskFormValues> = { ...value };

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
}
