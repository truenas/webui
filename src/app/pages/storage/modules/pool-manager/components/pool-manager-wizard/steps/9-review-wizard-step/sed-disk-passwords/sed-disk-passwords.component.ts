import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { isEqual, sortBy } from 'lodash-es';
import {
  distinctUntilChanged, map, merge, Observable, of, startWith, switchMap,
} from 'rxjs';
import { SedStatus } from 'app/enums/sed-status.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import {
  PoolManagerStore, PoolManagerTopology, SedDiskPasswordChange,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyToDisks } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import {
  SedPasswordSource,
} from 'app/pages/storage/modules/vdevs/components/sed-disk-password/sed-disk-password.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

type DiskPasswordForm = FormGroup<{
  source: FormControl<SedPasswordSource>;
  password: FormControl<string>;
  passwordConfirm: FormControl<string>;
}>;

/**
 * Shows which password each uninitialized SED disk in the layout will be set up with, and lets the user
 * pick it per disk. The pool job uses a disk's stored password, else the global one, and takes no per-disk
 * choice, so the wizard applies the choice with `disk.update` first: an individual password is stored,
 * choosing the global one clears it. Needed changes go to {@link PoolManagerStore.setSedDiskPasswords}.
 */
@Component({
  selector: 'ix-sed-disk-passwords',
  templateUrl: './sed-disk-passwords.component.html',
  styleUrls: ['./sed-disk-passwords.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    TestDirective,
    TestOverrideDirective,
    TranslateModule,
    FileSizePipe,
  ],
})
export class SedDiskPasswordsComponent {
  private api = inject(ApiService);
  private store = inject(PoolManagerStore);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly helptext = helptextPoolCreation;

  protected readonly form = new FormGroup<Record<string, DiskPasswordForm>>({});

  // ix-select translates the labels itself.
  protected readonly sourceOptions$: Observable<SelectOption<SedPasswordSource>[]> = of([
    { label: helptextPoolCreation.sedDiskPasswordGlobal, value: SedPasswordSource.Global },
    { label: helptextPoolCreation.sedDiskPasswordIndividual, value: SedPasswordSource.Individual },
  ]);

  private readonly encryptionType = toSignal(this.store.encryptionType$, { initialValue: EncryptionType.None });
  private readonly topology = toSignal(this.store.topology$, { initialValue: null as PoolManagerTopology | null });

  /** Disks the pool job will initialize, i.e. the uninitialized ones when the pool uses SED. */
  protected readonly disks = computed<DetailsDisk[]>(() => {
    const topology = this.topology();
    if (this.encryptionType() !== EncryptionType.Sed || !topology) {
      return [];
    }
    const disks = topologyToDisks(topology)
      .filter((disk) => disk.sed_status === SedStatus.Uninitialized);
    return sortBy(disks, (disk) => disk.devname);
  });

  private readonly identifiers = computed<string[]>(
    () => this.disks().map((disk) => disk.identifier),
    { equal: isEqual },
  );

  /** Each disk's stored individual password (`''` for none), or `undefined` while loading. */
  protected readonly storedPasswords = toSignal(
    toObservable(this.identifiers).pipe(
      distinctUntilChanged(isEqual),
      switchMap((identifiers) => {
        if (!identifiers.length) {
          return of(new Map<string, string>());
        }
        return this.api.call(
          'disk.query',
          [[['identifier', 'in', identifiers]], { extra: { passwords: true } }],
        ).pipe(
          map((disks) => new Map(disks.map((disk) => [disk.identifier, String(disk.passwd || '')]))),
          // Leaves the choices unloaded, which keeps the pool from being created with unknown passwords.
          this.errorHandler.withErrorHandler(),
          startWith(undefined),
        );
      }),
    ),
    { initialValue: undefined },
  );

  private readonly formState = toSignal(
    merge(this.form.valueChanges, this.form.statusChanges).pipe(
      startWith(null),
      map(() => ({ value: this.form.getRawValue(), isValid: this.form.valid })),
    ),
    { requireSync: true },
  );

  constructor() {
    // One group per disk, defaulting to what the job would do anyway: the disk's own password if it has one.
    effect(() => {
      const stored = this.storedPasswords();
      const identifiers = this.identifiers();
      if (!stored) {
        return;
      }

      Object.keys(this.form.controls)
        .filter((identifier) => !identifiers.includes(identifier))
        .forEach((identifier) => this.form.removeControl(identifier));

      identifiers
        .filter((identifier) => !this.form.contains(identifier))
        .forEach((identifier) => this.form.addControl(identifier, this.createDiskForm(stored.get(identifier) || '')));
    });

    effect(() => {
      this.store.setSedDiskPasswords({
        changes: this.changes(),
        isValid: this.isValid(),
      });
    });
  }

  protected hasForm(identifier: string): boolean {
    return Boolean(this.formState().value[identifier]);
  }

  protected isIndividual(identifier: string): boolean {
    return this.formState().value[identifier]?.source === SedPasswordSource.Individual;
  }

  private readonly isValid = computed(() => {
    if (!this.disks().length) {
      return true;
    }
    const isLoaded = Boolean(this.storedPasswords())
      && this.identifiers().every((identifier) => this.formState().value[identifier]);
    return isLoaded && this.formState().isValid;
  });

  private readonly changes = computed<SedDiskPasswordChange[]>(() => {
    const stored = this.storedPasswords();
    const values = this.formState().value;
    if (!stored) {
      return [];
    }

    return this.disks().flatMap((disk) => {
      const value = values[disk.identifier];
      if (!value) {
        return [];
      }
      const password = value.source === SedPasswordSource.Individual ? value.password : '';
      if (password === (stored.get(disk.identifier) || '')) {
        return [];
      }
      return [{ identifier: disk.identifier, name: disk.devname, password }];
    });
  });

  private createDiskForm(storedPassword: string): DiskPasswordForm {
    const group: DiskPasswordForm = new FormGroup({
      source: new FormControl(
        storedPassword ? SedPasswordSource.Individual : SedPasswordSource.Global,
        { nonNullable: true },
      ),
      password: new FormControl(storedPassword, { nonNullable: true, validators: [Validators.required] }),
      passwordConfirm: new FormControl(storedPassword, { nonNullable: true, validators: [Validators.required] }),
    }, {
      validators: [
        matchOthersFgValidator('passwordConfirm', ['password'], this.translate.instant(T('Passwords do not match'))),
      ],
    });

    // The password fields only count while they are shown.
    const togglePasswordFields = (source: SedPasswordSource): void => {
      const { password, passwordConfirm } = group.controls;
      if (source === SedPasswordSource.Individual) {
        password.enable({ emitEvent: false });
        passwordConfirm.enable({ emitEvent: false });
      } else {
        password.disable({ emitEvent: false });
        passwordConfirm.disable({ emitEvent: false });
      }
      group.updateValueAndValidity();
    };
    togglePasswordFields(group.controls.source.value);
    group.controls.source.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(togglePasswordFields);

    return group;
  }
}
