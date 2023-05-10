import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { combineLatest } from 'rxjs';
import { PoolManagerWizardFormValue } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { OldPoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-configuration-preview',
  templateUrl: './configuration-preview.component.html',
  styleUrls: ['./configuration-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationPreviewComponent implements OnInit {
  formValue: PoolManagerWizardFormValue;

  private disksSelectedManually = false;
  private vdevsCountString: string;
  private totalUsableCapacity: string;

  constructor(
    private poolManagerStore: OldPoolManagerStore,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.poolManagerStore.formValue$,
      this.poolManagerStore.disksSelectedManually$,
      this.poolManagerStore.dataVdevs$,
      this.poolManagerStore.totalUsableCapacity$,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([formValue, disksSelectedManually, dataVdevs, totalUsableCapacity]) => {
        this.formValue = formValue;
        this.disksSelectedManually = disksSelectedManually;
        this.vdevsCountString = `${dataVdevs.length} VDEVs`;
        this.totalUsableCapacity = this.translate.instant('{size} Total', {
          size: filesize(totalUsableCapacity, { standard: 'iec' }),
        });
        this.cdr.markForCheck();
      });
  }

  get unknownProp(): string {
    return this.translate.instant('None');
  }

  get name(): string {
    return this.formValue.general?.name || this.unknownProp;
  }

  private get vdevTypeConfiguration(): string {
    if (!this.formValue?.data?.vdevsNumber || !this.formValue?.data?.type) {
      return '';
    }

    if (this.disksSelectedManually) {
      return this.translate.instant('Manual layout');
    }

    return `${this.formValue.data.vdevsNumber} × ${this.formValue.data.type}`;
  }

  private get formattedDiskSize(): string {
    return filesize(Number(this.formValue.data.sizeAndType[0] || 0), { standard: 'iec' });
  }

  private get disksConfiguration(): string {
    if (!this.formValue?.data?.sizeAndType) {
      return '';
    }

    if (this.disksSelectedManually) {
      return `${this.vdevsCountString} | ${this.totalUsableCapacity}`;
    }

    return `${this.formValue.data.width} × ${this.formattedDiskSize} (${this.formValue.data.sizeAndType[1]})`;
  }

  get data(): string {
    if (!this.vdevTypeConfiguration || !this.disksConfiguration) {
      return this.unknownProp;
    }

    return `${this.vdevTypeConfiguration} | ${this.disksConfiguration}`;
  }

  get log(): string {
    return this.unknownProp;
  }

  get spare(): string {
    return this.unknownProp;
  }

  get cache(): string {
    return this.unknownProp;
  }

  get metadata(): string {
    return this.unknownProp;
  }

  get encryption(): string {
    return this.formValue.general?.encryption_standard || this.unknownProp;
  }
}
