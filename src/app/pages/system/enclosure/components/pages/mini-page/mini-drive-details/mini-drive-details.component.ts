import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatIconAnchor } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { enclosureDiskStatusLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-mini-drive-details',
  templateUrl: './mini-drive-details.component.html',
  styleUrl: './mini-drive-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconAnchor,
    TestDirective,
    IxIconComponent,
    IdentifyLightComponent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class MiniDriveDetailsComponent {
  private store = inject(EnclosureStore);

  readonly slot = input.required<DashboardEnclosureSlot>();

  readonly enclosureDiskStatusLabels = enclosureDiskStatusLabels;

  onClosePressed(): void {
    this.store.selectSlot(null);
  }
}
