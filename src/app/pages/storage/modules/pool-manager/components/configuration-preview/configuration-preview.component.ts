import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { PoolManagerWizardFormValue } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-configuration-preview',
  templateUrl: './configuration-preview.component.html',
  styleUrls: ['./configuration-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationPreviewComponent implements OnInit {
  formValue: PoolManagerWizardFormValue;

  constructor(
    private poolManagerStore: PoolManagerStore,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.formValue$.pipe(untilDestroyed(this)).subscribe((formValue) => {
      this.formValue = formValue;
      this.cdr.markForCheck();
    });
  }

  get unknownProp(): string {
    return this.translate.instant('None');
  }

  get name(): string {
    return this.formValue.general?.name || this.unknownProp;
  }

  get data(): string {
    if (!this.formValue.data?.sizeAndType[0] || !this.formValue.data?.vdevsNumber || !this.formValue.data?.width) {
      return this.unknownProp;
    }
    const part1 = `${this.formValue.data.vdevsNumber} x ${this.formValue.data.type} | `;
    const part2 = `${this.formValue.data.width} x ${filesize(Number(this.formValue.data.sizeAndType[0]), { standard: 'iec' })} | `;
    const part3 = this.formValue.data.sizeAndType[1];
    return part1 + part2 + part3;
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
