import { RoutePart } from 'app/services/route-parts/route-parts.service';

export interface PseudoRouteChangeEvent {
  name: 'PseudoRouteChange';
  sender: unknown;
  data: RoutePart[];
}
