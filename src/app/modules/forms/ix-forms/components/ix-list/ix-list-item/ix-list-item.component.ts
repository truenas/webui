import {
  ChangeDetectionStrategy,
  Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';

@Component({
  selector: 'ix-list-item',
  templateUrl: './ix-list-item.component.html',
  styleUrls: ['./ix-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TranslateModule,
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
