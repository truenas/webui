import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';
import { Enclosure } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-enclosure-wrapper',
  templateUrl: './enclosure-wrapper.component.html',
  styleUrls: ['./enclosure-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent],
})
export class EnclosureWrapperComponent {
  enclosure = input.required<Enclosure>();

  protected label = computed(() => this.enclosure().label || this.enclosure().name);
}
