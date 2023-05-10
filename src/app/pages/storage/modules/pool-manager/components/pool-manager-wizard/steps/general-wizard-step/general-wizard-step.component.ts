import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
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
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasExportedPool, hasNonUniqueSerial } from 'app/pages/storage/modules/pool-manager/utils/pool-manager.utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit {
  @Input() form: PoolManagerWizardComponent['form']['controls']['general'];

  poolNames$ = this.ws.call('pool.query').pipe(map((pools) => pools.map((pool) => pool.name)));

  exportedPoolsWarning = this.translate.instant(
    `The following disks have exported pools on them.
    Using those disks will make existing pools on them unable to be imported.
    You will lose any and all data in selected disks.`,
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
    private dialog: DialogService,
    private translate: TranslateService,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form.controls.name.addAsyncValidators(forbiddenAsyncValues(this.poolNames$));

    this.initEncryptionField();
    this.initUnsafeDisksWarnings();
  }

  private initEncryptionField(): void {
    this.form.controls.encryption_standard.disable();
    this.form.controls.encryption.valueChanges.pipe(untilDestroyed(this)).subscribe((isEncrypted) => {
      if (isEncrypted) {
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
              this.form.controls.encryption_standard.disable();
            } else {
              this.form.controls.encryption_standard.enable();
            }
            this.cdr.markForCheck();
          });
      } else {
        this.form.controls.encryption_standard.disable();
        this.cdr.markForCheck();
      }
    });
  }

  private initUnsafeDisksWarnings(): void {
    this.setWarningEvents();
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

  private setWarningEvents(): void {
    combineLatest([
      this.form.controls.allowDisksFromExportedPools.valueChanges.pipe(startWith<string[]>([])),
      this.form.controls.allowNonUniqueSerialDisks.valueChanges.pipe(startWith(false)),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([allowedPools, allowNonUnique]) => {
        const allowedDisks = this.disksWithExportedPools.filter((disk) => allowedPools.includes(disk.exported_zpool));

        if (allowNonUnique) {
          allowedDisks.push(...this.nonUniqueSerialDisks);
        }

        this.store.setAllowedUnsafeDisks(allowedDisks);
      });
  }
}
