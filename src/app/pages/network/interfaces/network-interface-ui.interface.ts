import { LinkAggregationProtocol } from 'app/enums/network-interface.enum';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';

export type NetworkInterfaceUi = {
  link_state?: string;
  addresses?: string[];
  active_media_type?: string;
  active_media_subtype?: string;
  mac_address?: string;
  lagg_ports?: string[];
  lagg_protocol?: LinkAggregationProtocol;
  received?: string;
  received_bytes?: number;
  sent?: string;
  sent_bytes?: number;
} & NetworkInterface;
