import { UUID } from 'angular2-uuid';

export function getUniqueId(): string {
  return 'id-' + UUID.UUID();
}
