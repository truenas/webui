import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ix-details-item',
  templateUrl: './details-item.component.html',
  styleUrl: './details-item.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsItemComponent {
  label = input('');
}
