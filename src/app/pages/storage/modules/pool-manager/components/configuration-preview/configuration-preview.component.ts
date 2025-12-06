import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { omitBy } from 'lodash-es';
import { map } from 'rxjs';
import { VDevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { TopologyCategoryDescriptionPipe } from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import {
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-configuration-preview',
  templateUrl: './configuration-preview.component.html',
  styleUrls: ['./configuration-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    TranslateModule,
    CastPipe,
    FileSizePipe,
    MapValuePipe,
    AsyncPipe,
    KeyValuePipe,
    TopologyCategoryDescriptionPipe,
  ],
})
export class ConfigurationPreviewComponent {
  private store = inject(PoolManagerStore);
  private translate = inject(TranslateService);

  protected readonly vdevTypeLabels = vdevTypeLabels;
  readonly vDevType = VDevType;
  protected readonly EncryptionType = EncryptionType;

  protected name$ = this.store.name$;
  protected encryption$ = this.store.encryption$;
  protected encryptionType$ = this.store.encryptionType$;

  protected topology$ = this.store.topology$.pipe(
    map((topology) => {
      // Remove empty vdevs and spare vdevs if using DRAID layout
      return omitBy(topology, (value, key) => {
        if ((key as VDevType) === VDevType.Spare && this.store.isUsingDraidLayout(topology)) {
          return true;
        }

        return value.vdevs.length === 0;
      });
    }),
  );

  protected totalCapacity$ = this.store.totalUsableCapacity$;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  get unknownProp(): string {
    return this.translate.instant('None');
  }
}
