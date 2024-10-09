import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

@Component({
  selector: 'ix-enclosure-side-switch',
  templateUrl: './enclosure-side-switch.component.html',
  styleUrl: './enclosure-side-switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class EnclosureSideSwitchComponent {
  readonly enclosure = input.required<DashboardEnclosure>();

  protected readonly hasMoreThanOneSide = computed(() => {
    return [
      this.enclosure().front_loaded,
      this.enclosure().top_loaded,
      this.enclosure().rear_slots > 0,
      this.enclosure().internal_slots > 0,
    ].filter(Boolean).length > 1;
  });

  protected readonly EnclosureSide = EnclosureSide;

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSideChange(side: EnclosureSide): void {
    this.store.selectSide(side);
  }
}
