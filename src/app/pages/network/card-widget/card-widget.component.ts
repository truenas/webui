import { Component, Input } from '@angular/core';
import { Option } from 'app/interfaces/option.interface';

export interface CardWidgetConf<P> {
  title: string;
  data: {
    nameserver?: Option[];
    ipv4?: (string | { ip: string; dhcp: boolean })[];
    ipv6?: (string | { ip: string; dhcp: boolean })[];
    hostname?: string;
    domain?: string;
    netwait?: string;
    service_announcement?: string;
    additional_domains?: string;
    httpproxy?: string;
    hostnameDB?: string;
    outbound?: string;
  };
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
