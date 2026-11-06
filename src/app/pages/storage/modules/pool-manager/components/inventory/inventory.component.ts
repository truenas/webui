import { KeyValue, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnCardHeaderDirective, TnIconComponent, TnTestIdDirective } from '@truenas/ui-components';
import { DiskType } from 'app/enums/disk-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

@Component({
  selector: 'ix-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    TnCardComponent,
    TnCardHeaderDirective,
    TnIconComponent,
    TranslateModule,
    KeyValuePipe,
  ],
})
export class InventoryComponent {
  private poolManagerStore = inject(PoolManagerStore);

  protected readonly DiskType = DiskType;
  protected readonly EncryptionType = EncryptionType;

  protected isLoading = this.poolManagerStore.isLoading;
  protected hasDisks = computed(() => this.poolManagerStore.inventory().length > 0);
  protected encryptionType = this.poolManagerStore.encryptionType;
  protected sizeDisksMap = computed<DiskTypeSizeMap>(() => getDiskTypeSizeMap(this.poolManagerStore.inventory()));

  getFilesize(size: string): string {
    return buildNormalizedFileSize(Number(size));
  }

  protected orderBySize(a: KeyValue<string, DetailsDisk[]>, b: KeyValue<string, DetailsDisk[]>): number {
    return Number(a.key) - Number(b.key);
  }
}
