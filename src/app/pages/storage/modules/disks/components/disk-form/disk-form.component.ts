import { ChangeDetectionStrategy, Component, DestroyRef, computed, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
  type TnSelectOption,
} from '@truenas/ui-components';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
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
import { EntitlementsService } from 'app/services/entitlements.service';

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
export class DiskFormComponent extends IxFormHostForm<DiskFormResponse> implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
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
   *
   * Plain fields, not computeds: the asterisk and the validator are two halves of one decision,
   * so they are resolved together in `ngOnInit` (the panel sets `diskToEdit` once, before it)
   * rather than leaving the marker reactive and the validator imperative — a pair with two
   * reactivity models drifts the moment the input becomes re-settable.
   */
  protected isHddStandbyRequired = false;
  protected isAdvPowerManagementRequired = false;

  private readonly hasSedEntitlement = this.entitlements.entitled(EntitlementFeature.Sed);
  protected readonly showSedSection = computed(() => Boolean(this.hasSedEntitlement()));

  ngOnInit(): void {
    const disk = this.diskToEdit();

    this.isHddStandbyRequired = Boolean(disk?.hddstandby);
    if (this.isHddStandbyRequired) {
      this.form.controls.hddstandby.addValidators(Validators.required);
      // `addValidators` deliberately doesn't re-run validation. Do it here rather than relying on
      // `<ix-form>`'s own `ngOnInit` patch to revalidate as a side effect, which would make the
      // control's validity depend on the order two components' hooks happen to run in.
      this.form.controls.hddstandby.updateValueAndValidity({ emitEvent: false });
    }

    this.isAdvPowerManagementRequired = Boolean(disk?.advpowermgmt);
    if (this.isAdvPowerManagementRequired) {
      this.form.controls.advpowermgmt.addValidators(Validators.required);
      this.form.controls.advpowermgmt.updateValueAndValidity({ emitEvent: false });
    }

    // Wired unconditionally: the entitlement resolves asynchronously, and the subscription is
    // inert while the SED section is hidden, so there is nothing to gate here.
    this.clearPasswordField();
  }

  protected readonly handleSubmit = (event: FormSubmitEvent<DiskFormValues>): SubmitResult<DiskFormResponse> => {
    const diskId = this.diskToEdit().identifier;
    const valuesDiskUpdate = this.prepareUpdate(event.allValues);

    return {
      request$: this.api.call('disk.update', [diskId, valuesDiskUpdate]),
      successMessage: this.translate.instant('Disk settings successfully saved.'),
      // The panel host forwards this to its opener, which reconciles the edited row.
      closeWith: () => [{ identifier: diskId, ...valuesDiskUpdate }],
    };
  };

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
