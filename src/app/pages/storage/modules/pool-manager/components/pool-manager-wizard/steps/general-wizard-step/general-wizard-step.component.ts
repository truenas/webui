import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, Observable, of, tap,
} from 'rxjs';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Option } from 'app/interfaces/option.interface';
import { forbiddenAsyncValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation/forbidden-values-validation';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
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

  isLoading$ = this.store.isLoading$;
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
  exportedPools$: Observable<string[]> = this.store.exportedPools$;
  exportedPoolsOptions$: Observable<Option[]> = this.exportedPools$.pipe(
    map((pools) => pools.map((pool) => ({ label: pool, value: pool }))),
  );

  nonUniqueSerialDisksTooltip: string;
  nonUniqueSerialDisks$ = this.store.nonUniqueSerialDisks$.pipe(
    tap((disks) => {
      let tooltip = this.translate.instant(
        `Warning: There are {n} disks available that have non-unique serial numbers.
        Non-unique serial numbers can be caused by a cabling issue and
        adding such disks to a pool can result in lost data.`,
        { n: disks.length },
      );

      if (disks.every((disk) => disk.bus === DiskBus.Usb)) {
        tooltip = this.translate.instant(
          `Warning: There are {n} USB disks available that have non-unique serial numbers.
          USB controllers may report disk serial incorrectly, making such disks indistinguishable from each other.
          Adding such disks to a pool can result in lost data.`,
          { n: disks.length },
        );
      }

      this.nonUniqueSerialDisksTooltip = tooltip;
    }),
  );
  allowNonUniqueSerialDisksOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Allow'), value: 'true' },
    { label: this.translate.instant('Don\'t Allow'), value: 'false' },
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
}
