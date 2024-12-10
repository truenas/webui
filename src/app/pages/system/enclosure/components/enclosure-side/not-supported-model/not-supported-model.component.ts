import {
  ChangeDetectionStrategy, Component, input, model, OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';

@Component({
  selector: 'ix-not-supported-model',
  templateUrl: './not-supported-model.component.html',
  styleUrls: ['./not-supported-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TestDirective, TranslateModule],
})
export class NotSupportedModelComponent implements OnInit {
  readonly model = input.required<string>();
  readonly slots = input.required<DashboardEnclosureSlot[]>();
  readonly enableMouseEvents = input(true);
  readonly slotTintFn = input.required<TintingFunction>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);

  protected readonly highCountThreshold = 60;

  ngOnInit(): void {
    console.error(`Unsupported enclosure model: ${this.model()}`);
  }
}
