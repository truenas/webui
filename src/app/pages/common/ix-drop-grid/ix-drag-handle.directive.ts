import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Directive } from '@angular/core';
import { ixDragHandleDirectiveToken } from 'app/pages/common/ix-drop-grid/ix-drop-grid.tokens';

@Directive({
  selector: '[ixDragHandle]',
  providers: [{ provide: ixDragHandleDirectiveToken, useExisting: IxDragHandleDirective }],
})
export class IxDragHandleDirective extends CdkDragHandle {}
