import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import {
  SlotSize,
} from 'app/pages/dashboard/types/widget.interface';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { systemImageWidget } from 'app/pages/dashboard/widgets/system/widget-system-image/widget-system-image.definition';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectHasEnclosureSupport, selectIsEnterprise, selectIsIxHardware } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-system-image',
  templateUrl: './widget-system-image.component.html',
  styleUrls: ['./widget-system-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    ProductImageComponent,
    TranslateModule,
  ],
})
export class WidgetSystemImageComponent implements WidgetComponent {
  size = input.required<SlotSize>();
  readonly name = systemImageWidget.name;

  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  hasEnclosureSupport = toSignal(this.store$.select(selectHasEnclosureSupport));

  systemInfo = toSignal(this.resources.systemInfo$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.value),
  ));

  constructor(
    private resources: WidgetResourcesService,
    private store$: Store<AppState>,
  ) {}
}
