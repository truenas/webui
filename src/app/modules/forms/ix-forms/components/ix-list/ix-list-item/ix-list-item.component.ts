import {
  ChangeDetectionStrategy,
  Component, Input, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'ix-list-item',
  templateUrl: './ix-list-item.component.html',
  styleUrls: ['./ix-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestIdModule,
    IxIconModule,
    TranslateModule,
  ],
})
export class IxListItemComponent {
  readonly canDelete = input(true);
  @Input() label?: string;

  readonly delete = output();

  deleteItem(): void {
    this.delete.emit();
  }
}
