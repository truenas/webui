import { AsyncPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
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
  standalone: true,
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
  protected readonly vdevTypeLabels = vdevTypeLabels;

  protected name$ = this.store.name$;
  protected encryption$ = this.store.encryption$;

  protected topology$ = this.store.topology$.pipe(
    map((topology) => {
      const newTopology = { ...topology };
      if (this.store.isUsingDraidLayout(newTopology)) {
        delete newTopology.spare;
      }
      return newTopology;
    }),
  );

  protected totalCapacity$ = this.store.totalUsableCapacity$;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  constructor(
    private store: PoolManagerStore,
    private translate: TranslateService,
  ) {}

  get unknownProp(): string {
    return this.translate.instant('None');
  }
}
