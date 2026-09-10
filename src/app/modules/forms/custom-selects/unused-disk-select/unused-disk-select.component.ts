import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, forwardRef, input, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnAutocompleteComponent, TnCheckboxComponent, TnFormFieldComponent } from '@truenas/ui-components';
import {
  combineLatest, distinctUntilChanged, filter, map,
} from 'rxjs';
import { shareReplay, startWith } from 'rxjs/operators';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ignoreTranslation, TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getNonUniqueSerialDisksWarning,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import { hasNonUniqueSerial } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

/**
 * Presents unused disks, shows their size and if there is exported pool on them.
 * Shows warning when user selects a disk with an exported pool.
 * Show extra "Allow non-unique serialed disks" if user has such disks.
 *
 * Like the other `custom-selects`, this is the {@link ControlValueAccessor} for the host's
 * `formControlName`: the `<tn-autocomplete>` inside is bound to {@link diskControl}, and this
 * component mediates between it and the host's control.
 */
@Component({
  selector: 'ix-unused-disk-select',
  templateUrl: './unused-disk-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UnusedDiskSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TranslateModule,
    TnAutocompleteComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
  ],
})
export class UnusedDiskSelectComponent implements ControlValueAccessor, OnInit {
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  /**
   * Optional function to filter disks in addition to default select's behaviour.
   */
  readonly diskFilteringFn = input<(disk: DetailsDisk) => boolean>();
  readonly label = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly tooltip = input<TranslatedString>();
  // TODO: It may be better to allow for object to be written as value.
  readonly valueField = input<keyof DetailsDisk>('name');
  /**
   * Test-id base for the disk picker. The `<tn-autocomplete>` is bound through a bare
   * `[formControl]`, so it has no control name to fall back on — pass the host's control name
   * to keep each usage addressable under its own id.
   */
  readonly testId = input('unused-disk');

  readonly unusedDisks = signal<DetailsDisk[]>([]);
  readonly nonUniqueSerialDisks = computed(() => this.unusedDisks().filter(hasNonUniqueSerial));

  readonly nonUniqueSerialDisksTooltip = computed(() => {
    return getNonUniqueSerialDisksWarning(this.nonUniqueSerialDisks(), this.translate);
  });

  private unusedDisks$ = this.api.call('disk.details').pipe(
    map((diskDetails) => {
      return [
        ...diskDetails.unused,
        ...diskDetails.used.filter((disk) => disk.exported_zpool),
      ];
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected allowDuplicateSerials = new FormControl(false, { nonNullable: true });

  /** Drives the inner `<tn-autocomplete>`. */
  protected readonly diskControl = new FormControl<string | null>(null);

  protected shownOptions$ = combineLatest([
    this.unusedDisks$,
    this.allowDuplicateSerials.valueChanges.pipe(startWith(false)),
    toObservable(this.diskFilteringFn),
    toObservable(this.valueField),
  ])
    .pipe(
      map(([unusedDisks, allowDuplicateSerials, filteringFn, valueField]) => {
        const disks = this.filterShownDisks(unusedDisks, { allowDuplicateSerials, filteringFn });
        return this.mapDisksToOptions(disks, valueField);
      }),
    );

  private onChange: (value: string | null) => void = (): void => {};
  private onTouched: () => void = (): void => {};

  constructor() {
    // Mirror the host's required state onto the inner control so `<tn-form-field>` renders the
    // inline "required" error: the field reads validity from the control it wraps, not from the
    // host's form control, which carries the actual validator.
    effect(() => {
      this.diskControl.setValidators(this.required() ? [Validators.required] : []);
      this.diskControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.loadDisks();
    this.setupExportedPoolWarning();

    this.diskControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => {
      this.onChange(value);
      this.onTouched();
    });
  }

  writeValue(value: string | null): void {
    this.diskControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(onChange: (value: string | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.diskControl.disable({ emitEvent: false });
    } else {
      this.diskControl.enable({ emitEvent: false });
    }
  }

  private loadDisks(): void {
    this.unusedDisks$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((disks) => {
        this.unusedDisks.set(disks);
      });
  }

  private setupExportedPoolWarning(): void {
    this.diskControl.valueChanges.pipe(
      distinctUntilChanged(),
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe((diskName: string) => this.warnAboutExportedPool(diskName));
  }

  private filterShownDisks(
    unusedDisks: DetailsDisk[],
    {
      allowDuplicateSerials,
      filteringFn,
    }: {
      allowDuplicateSerials: boolean;
      filteringFn: ((disk: DetailsDisk) => boolean) | undefined;
    },
  ): DetailsDisk[] {
    return unusedDisks.filter((disk) => {
      if (hasNonUniqueSerial(disk) && !allowDuplicateSerials) {
        return false;
      }

      return filteringFn ? filteringFn(disk) : true;
    });
  }

  private mapDisksToOptions(unusedDisks: DetailsDisk[], valueField: keyof DetailsDisk): Option[] {
    return unusedDisks
      .map((disk) => {
        const exportedPool = disk.exported_zpool ? `(${disk.exported_zpool})` : '';

        return {
          label: ignoreTranslation(`${disk.devname} (${buildNormalizedFileSize(disk.size)}) ${exportedPool}`),
          value: disk[valueField] as string,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private warnAboutExportedPool(diskName: string): void {
    const unusedDisk = this.unusedDisks().find((disk) => disk.name === diskName);
    if (!unusedDisk?.exported_zpool) {
      return;
    }
    this.dialogService.warn(
      this.translate.instant('Warning') + ': ' + unusedDisk.name,
      this.translate.instant(helptextVolumeStatus.exportedPoolWarning, { pool: `'${unusedDisk.exported_zpool}'` }),
    );
  }
}
