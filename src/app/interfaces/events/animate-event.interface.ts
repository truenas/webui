import { AnimationConfig } from 'app/core/services/animation.service';

export interface AnimateEvent {
  name: 'Animate';
  sender: unknown;
  data: AnimationConfig;
}
