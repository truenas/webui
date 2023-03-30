import { ChangeDetectionStrategy, Component } from '@angular/core';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';

@Component({
  selector: 'ix-support-card',
  templateUrl: './support-card.component.html',
  styleUrls: ['./support-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportCardComponent {
  supportTitle = helptext.supportTitle;
}
