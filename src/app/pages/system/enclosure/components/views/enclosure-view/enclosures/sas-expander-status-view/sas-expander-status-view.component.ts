import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { EnclosureElement } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-sas-expander-status-view',
  templateUrl: './sas-expander-status-view.component.html',
  styleUrl: './sas-expander-status-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SasExpanderStatusViewComponent {
  expanders = input.required<EnclosureElement[]>();
}
