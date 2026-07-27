import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCardComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

@Component({
  selector: 'ix-unused-disk-card',
  templateUrl: './unused-disk-card.component.html',
  styleUrls: ['./unused-disk-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    RequiresRolesDirective,
    TnButtonComponent,
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
