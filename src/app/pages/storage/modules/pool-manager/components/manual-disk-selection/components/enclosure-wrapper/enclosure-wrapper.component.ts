import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-wrapper',
  templateUrl: './enclosure-wrapper.component.html',
  styleUrls: ['./enclosure-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxIconComponent],
})
export class EnclosureWrapperComponent {
  enclosure = input.required<Enclosure>();

  protected label = computed(() => this.enclosure().label || this.enclosure().name);
}
