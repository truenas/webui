import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  map, Observable, of, combineLatest,
} from 'rxjs';
import { startWith } from 'rxjs/operators';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Option } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { forbiddenAsyncValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasExportedPool, hasNonUniqueSerial } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit {
  protected form = this.formBuilder.group({
    name: ['', Validators.required],
    encryption: [false],
    encryptionStandard: ['AES-256-GCM', Validators.required],
    allowNonUniqueSerialDisks: [false],
    allowDisksFromExportedPools: [[] as string[]],
  });

  poolNames$ = this.ws.call('pool.query').pipe(map((pools) => pools.map((pool) => pool.name)));

  // TODO: Extract warnings into a separate component.
  exportedPoolsWarning = this.translate.instant(
    `The following disks have exported pools on them.
    Using those disks will make existing pools on them unable to be imported.
    You will lose any and all data in selected pools.`,
  );
  exportedPoolsTooltip = this.translate.instant(
    `Some of the disks are attached to the exported pools
    mentioned in this list. Checking a pool name means you want to
    allow reallocation of the disks attached to that pool.`,
  );

  nonUniqueSerialDisks: UnusedDisk[] = [];
  nonUniqueSerialDisksTooltip: string;

  disksWithExportedPools: UnusedDisk[] = [];
  exportedPoolsOptions$ = of<Option[]>([]);

  allowNonUniqueSerialDisksOptions$: Observable<Option<boolean>[]> = of([
    { label: this.translate.instant('Allow'), value: true },
    { label: this.translate.instant('Don\'t Allow'), value: false },
  ]);

  readonly encryptionAlgorithmOptions$ = this.ws
    .call('pool.dataset.encryption_algorithm_choices')
    .pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialog: DialogService,
    private translate: TranslateService,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form.controls.name.addAsyncValidators(forbiddenAsyncValues(this.poolNames$));

    this.initEncryptionField();
    this.initUnsafeDisksWarnings();
    this.connectGeneralOptionsToStore();
    this.connectWarningsToStore();
  }

  private initEncryptionField(): void {
    this.form.controls.encryption.valueChanges.pipe(untilDestroyed(this)).subscribe((isEncrypted) => {
      if (!isEncrypted) {
        return;
      }

      this.dialog
        .confirm({
          title: this.translate.instant('Warning'),
          message: helptext.manager_encryption_message,
          buttonText: this.translate.instant('I Understand'),
        })
        .pipe(untilDestroyed(this))
        .subscribe((confirmed) => {
          if (!confirmed) {
            this.form.controls.encryption.setValue(false);
          }
          this.cdr.markForCheck();
        });
    });
  }

  private initUnsafeDisksWarnings(): void {
    this.store.allDisks$.pipe(untilDestroyed(this)).subscribe((allDisks) => {
      this.nonUniqueSerialDisks = allDisks.filter(hasNonUniqueSerial);
      this.disksWithExportedPools = allDisks.filter(hasExportedPool);

      this.setNonUniqueSerialDisksWarning();
      this.setExportedPoolOptions();
      this.cdr.markForCheck();
    });
  }

  private setNonUniqueSerialDisksWarning(): void {
    if (this.nonUniqueSerialDisks.every((disk) => disk.bus === DiskBus.Usb)) {
      this.nonUniqueSerialDisksTooltip = this.translate.instant(
        `Warning: There are {n} USB disks available that have non-unique serial numbers.
          USB controllers may report disk serial incorrectly, making such disks indistinguishable from each other.
          Adding such disks to a pool can result in lost data.`,
        { n: this.nonUniqueSerialDisks.length },
      );
      return;
    }

    this.nonUniqueSerialDisksTooltip = this.translate.instant(
      `Warning: There are {n} disks available that have non-unique serial numbers.
        Non-unique serial numbers can be caused by a cabling issue and
        adding such disks to a pool can result in lost data.`,
      { n: this.nonUniqueSerialDisks.length },
    );
  }

  private setExportedPoolOptions(): void {
    const exportedPools = this.disksWithExportedPools.map((disk) => disk.exported_zpool);
    const options = _.uniq(exportedPools).map((pool) => ({ label: pool, value: pool }));
    this.exportedPoolsOptions$ = of(options);
  }

  private connectGeneralOptionsToStore(): void {
    combineLatest([
      this.form.controls.name.valueChanges.pipe(startWith('')),
      this.form.controls.encryption.valueChanges.pipe(startWith(false)),
      this.form.controls.encryptionStandard.valueChanges.pipe(startWith('AES-256-GCM')),
    ]).pipe(untilDestroyed(this)).subscribe(([name, encryption, encryptionStandard]) => {
      this.store.setGeneralOptions({
        name,
        encryption: encryption ? encryptionStandard : null,
      });
    });
  }

  private connectWarningsToStore(): void {
    combineLatest([
      this.form.controls.allowDisksFromExportedPools.valueChanges.pipe(startWith([])),
      this.form.controls.allowNonUniqueSerialDisks.valueChanges.pipe(startWith(false)),
    ]).pipe(untilDestroyed(this)).subscribe(([allowExportedPools, allowNonUniqueSerialDisks]) => {
      this.store.setDiskWarningOptions({
        allowExportedPools,
        allowNonUniqueSerialDisks,
      });
    });
  }
}
