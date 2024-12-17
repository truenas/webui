import {
  ChangeDetectionStrategy,
  Component, input, output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-list-item',
  templateUrl: './ix-list-item.component.html',
  styleUrls: ['./ix-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    IxIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class IxListItemComponent {
  readonly canDelete = input(true);
  readonly label = input<string>();

  readonly delete = output();

  deleteItem(): void {
    this.delete.emit();
  }
}
