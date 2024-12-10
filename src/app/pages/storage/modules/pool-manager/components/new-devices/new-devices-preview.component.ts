import { AsyncPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TopologyCategoryDescriptionPipe } from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import {
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-new-devices-preview',
  templateUrl: './new-devices-preview.component.html',
  styleUrls: ['./new-devices-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    TranslateModule,
    CastPipe,
    MapValuePipe,
    AsyncPipe,
    KeyValuePipe,
    TopologyCategoryDescriptionPipe,
  ],
})
export class NewDevicesPreviewComponent {
  protected readonly vdevTypeLabels = vdevTypeLabels;
  protected topology$ = this.store.topology$;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  constructor(
    private store: PoolManagerStore,
  ) {}
}
