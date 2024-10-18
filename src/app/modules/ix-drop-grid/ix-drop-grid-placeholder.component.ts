import {
  AfterViewInit, ChangeDetectionStrategy, Component, Inject, Optional, SkipSelf, ViewChild,
} from '@angular/core';
import { IxDropGridItemDirective } from 'app/modules/ix-drop-grid/ix-drop-grid-item.directive';
import { IxDropGridDirective } from 'app/modules/ix-drop-grid/ix-drop-grid.directive';
import { ixDropGridDirectiveToken } from 'app/modules/ix-drop-grid/ix-drop-grid.tokens';

@Component({
  selector: 'ix-drop-grid-placeholder',
  template: '<div ixDropGridItem></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxDropGridItemDirective],
})
export class IxDropGridPlaceholderComponent implements AfterViewInit {
  @ViewChild(IxDropGridItemDirective) itemInstance: IxDropGridItemDirective;

  constructor(
    @Optional()
    @Inject(ixDropGridDirectiveToken)
    @SkipSelf()
    private parentGrid?: IxDropGridDirective,
  ) { }

  ngAfterViewInit(): void {
    if (!this.parentGrid) {
      return;
    }

    const phElement = this.itemInstance.element.nativeElement;
    phElement.style.display = 'none';
    phElement.parentElement.removeChild(phElement);

    this.parentGrid.registerPlaceholder(this);
  }
}
