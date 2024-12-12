import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-sas-expander-status-view',
  templateUrl: './sas-expander-status-view.component.html',
  styleUrl: './sas-expander-status-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class SasExpanderStatusViewComponent {
  readonly enclosure = input.required<DashboardEnclosure>();

  protected expanders = computed(() => {
    const expanders = this.enclosure().elements[EnclosureElementType.SasExpander];
    return Object.values(expanders);
  });
}
