import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-unused-disk-card',
  templateUrl: './unused-disk-card.component.html',
  styleUrls: ['./unused-disk-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class UnusedDiskCardComponent {
  readonly title = input<string>('');
  readonly disks = input.required<DetailsDisk[]>();

  readonly addToStorage = output();

  protected readonly requiredRoles = [Role.DiskWrite];

  onAddToStorage(): void {
    this.addToStorage.emit();
  }
}
