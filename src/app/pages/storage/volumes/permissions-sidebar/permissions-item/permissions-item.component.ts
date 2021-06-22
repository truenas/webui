import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-permissions-item',
  templateUrl: 'permissions-item.component.html',
  styleUrls: ['./permissions-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsItemComponent {
  @Input() name: string;
  @Input() type: 'user' | 'group' | 'other';
  @Input() permissions: string;
}
