import { Component, Input } from '@angular/core';

export interface CardWidgetConf<P> {
  title: string;
  data: any;
  parent: P;
  icon?: string;
  showGroupTitle?: boolean;
  name?: string;
  onclick?: () => void;
}

@Component({
  selector: 'card-widget',
  templateUrl: './card-widget.component.html',
  styleUrls: ['./card-widget.component.scss'],
})
export class CardWidgetComponent {
  @Input() conf: CardWidgetConf<unknown>;
}
