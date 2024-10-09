import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Directive } from '@angular/core';
import { ixDragHandleDirectiveToken } from 'app/modules/ix-drop-grid/ix-drop-grid.tokens';

@Directive({
  selector: '[ixDragHandle]',
  providers: [{ provide: ixDragHandleDirectiveToken, useExisting: IxDragHandleDirective }],
  standalone: true,
})
export class IxDragHandleDirective extends CdkDragHandle {}
