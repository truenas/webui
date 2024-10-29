import { NgClass, NgStyle } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AngularDualListBoxModule, DualListComponent } from 'angular-dual-listbox';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-dual-listbox',
  templateUrl: './dual-listbox.component.html',
  styleUrls: ['./dual-listbox.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    NgStyle,
    MatButton,
    AngularDualListBoxModule,
    IxIconComponent,
    MatIconButton,
    TestDirective,
    TranslateModule,
  ],
})
export class DualListBoxComponent extends DualListComponent {
  sourceName = input(null);
  targetName = input(null);
  listItemIcon = input(null);

  moveAll(): void {
    this.selectAll(this.available);
    this.moveItem(this.available, this.confirmed);
  }

  removeAll(): void {
    this.selectAll(this.confirmed);
    this.moveItem(this.confirmed, this.available);
  }
}
