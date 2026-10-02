import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, map, Observable, of, startWith, switchMap,
} from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { RadioOption } from 'app/interfaces/option.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { EntitlementsService } from 'app/services/entitlements.service';

export enum SedPasswordSource {
  Global = 'global',
  Individual = 'individual',
}

/** The disk the host has picked, as far as SED setup is concerned. */
interface SedDiskState {
  name: string;
  status: SedStatus.Uninitialized | SedStatus.Locked;
}

/**
 * Lets the user choose which password a SED disk is set up or unlocked with when it joins a pool,
 * for the dialogs that hand a new disk to `pool.attach` or `pool.replace`.
 *
 * Those jobs prepare a SED disk themselves, but only ever with the global SED password: they
 * initialize an uninitialized disk when the pool is all-SED, and unlock a locked one. This section
 * appears when the picked disk is in one of those states and offers an individual password
 * instead. {@link prepareDisk} applies it through `disk.setup_sed` / `disk.unlock_sed`, which
 * also store it as the disk's own password, before the host starts its job; the job then finds
 * the disk unlocked and leaves it alone. Choosing the global password changes nothing about what
 * the job already does.
 */
@Component({
  selector: 'ix-sed-disk-password',
  templateUrl: './sed-disk-password.component.html',
  styleUrls: ['./sed-disk-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxRadioGroupComponent,
    TranslateModule,
  ],
})
export class SedDiskPasswordComponent {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private entitlements = inject(EntitlementsService);

  readonly poolId = input.required<number>();
  /** The value of the host's disk picker, or empty while nothing is picked. */
  readonly disk = input<string | null>(null);
  /** Which disk field the host's picker reports (`ix-unused-disk-select`'s `valueField`). */
  readonly diskField = input<'name' | 'identifier'>('name');

  protected readonly SedStatus = SedStatus;
  protected readonly helptext = helptextVolumeStatus.sedDiskPassword;

  protected readonly form = this.formBuilder.nonNullable.group({
    source: [SedPasswordSource.Global],
    password: ['', Validators.required],
    passwordConfirm: ['', Validators.required],
  }, {
    validators: [
      matchOthersFgValidator('passwordConfirm', ['password'], this.translate.instant(T('Passwords do not match'))),
    ],
  });

  /** `undefined` until middleware answers, so the choice is not made for the user while loading. */
  private readonly isGlobalPasswordSet = toSignal(this.api.call('system.advanced.sed_global_password_is_set'));

  private readonly isPoolAllSed = toSignal(
    toObservable(this.poolId).pipe(
      switchMap((poolId) => this.api.call('pool.query', [[['id', '=', poolId]], { select: ['all_sed'] }])),
      map(([pool]) => Boolean(pool?.all_sed)),
    ),
    { initialValue: false },
  );

  private readonly pickedDisk = toSignal(
    combineLatest([
      toObservable(this.disk),
      toObservable(this.diskField),
      this.entitlements.entitled$(EntitlementFeature.Sed),
    ]).pipe(
      switchMap(([disk, field, isEntitled]) => {
        if (!disk || !isEntitled) {
          return of(null);
        }
        return this.api.call('disk.query', [[[field, '=', disk]], { extra: { sed_status: true } }]).pipe(
          map(([found]) => (found?.sed ? { name: found.name, status: found.sed_status } : null)),
        );
      }),
    ),
    { initialValue: null },
  );

  /**
   * The disk this section applies to, or `null` when the job needs no help with it: a locked disk
   * always has to be unlocked, while an uninitialized one is only set up for an all-SED pool —
   * anywhere else it joins as a plain disk.
   */
  protected readonly sedDisk = computed<SedDiskState | null>(() => {
    const disk = this.pickedDisk();
    if (disk?.status === SedStatus.Locked) {
      return { name: disk.name, status: SedStatus.Locked };
    }
    if (disk?.status === SedStatus.Uninitialized && this.isPoolAllSed()) {
      return { name: disk.name, status: SedStatus.Uninitialized };
    }
    return null;
  });

  private readonly isGlobalPasswordMissing = computed(() => this.isGlobalPasswordSet() === false);

  protected readonly sourceOptions$: Observable<RadioOption<SedPasswordSource>[]> = toObservable(
    this.isGlobalPasswordMissing,
  ).pipe(
    // ix-radio-group translates the labels itself.
    map((isGlobalMissing) => [
      {
        label: isGlobalMissing ? T('Global SED password (not set)') : T('Global SED password'),
        value: SedPasswordSource.Global,
      },
      { label: T('Individual password for this disk'), value: SedPasswordSource.Individual },
    ]),
  );

  private readonly source = toSignal(
    this.form.controls.source.valueChanges.pipe(startWith(this.form.controls.source.value)),
    { requireSync: true },
  );

  protected readonly isIndividual = computed(() => this.source() === SedPasswordSource.Individual);

  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { requireSync: true },
  );

  /**
   * Whether the host may submit: nothing is asked of the user, or what is asked is filled in.
   * `ix-radio-group` cannot disable a single option, so a missing global password is checked here.
   */
  readonly isValid = computed(() => {
    if (!this.sedDisk()) {
      return true;
    }
    if (!this.isIndividual() && this.isGlobalPasswordMissing()) {
      return false;
    }
    return this.formStatus() !== 'INVALID';
  });

  constructor() {
    // Without a global password the individual one is the only way the disk can be prepared.
    effect(() => {
      if (this.isGlobalPasswordMissing()) {
        this.form.controls.source.setValue(SedPasswordSource.Individual);
      }
    });

    // The password fields only count while they are shown. Confirmation is asked for when a new
    // password is being written to the disk, not when an existing one unlocks it.
    effect(() => {
      const disk = this.sedDisk();
      const { password, passwordConfirm } = this.form.controls;
      if (disk && this.isIndividual()) {
        password.enable();
        if (disk.status === SedStatus.Uninitialized) {
          passwordConfirm.enable();
        } else {
          passwordConfirm.disable();
        }
      } else {
        password.disable();
        passwordConfirm.disable();
      }
    });
  }

  /**
   * Applies an individual password to the picked disk, so the host's job finds it ready. Emits
   * once and completes; emits straight away when there is nothing to apply.
   */
  prepareDisk(): Observable<unknown> {
    const disk = this.sedDisk();
    if (!disk || !this.isIndividual()) {
      return of(null);
    }

    const params = { name: disk.name, password: this.form.controls.password.value };
    return disk.status === SedStatus.Uninitialized
      ? this.api.call('disk.setup_sed', [params])
      : this.api.call('disk.unlock_sed', [params]);
  }
}
