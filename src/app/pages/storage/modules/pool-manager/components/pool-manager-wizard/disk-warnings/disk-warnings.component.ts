import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, map, tap, of,
} from 'rxjs';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { RadioOption, Option } from 'app/interfaces/option.interface';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@Component({
  selector: 'ix-disk-warnings',
  templateUrl: './disk-warnings.component.html',
  styleUrls: ['./disk-warnings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskWarningsComponent {
  @Input() form: PoolManagerWizardComponent['form']['controls']['general'];

  constructor(
    private translate: TranslateService,
    private store: PoolManagerStore,
  ) {}

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
  exportedPoolDisks$ = this.store.exportedPoolDisks$;
  exportedPoolDisksOptions$: Observable<Option[]> = this.exportedPoolDisks$.pipe(
    map((disks) => disks.map((disk) => ({
      label: `${disk.devname} (${disk.exported_zpool})`,
      value: disk.identifier,
    }))),
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
  allowNonUniqueSerialDisksOptions$: Observable<RadioOption[]> = of([
    { label: this.translate.instant('Allow'), value: 'true' },
    { label: this.translate.instant('Don\'t Allow'), value: 'false' },
  ]);
}
