import { CDK_DRAG_CONFIG, DragDropConfig, DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { IxDragHandleDirective } from 'app/pages/common/ix-drop-grid/ix-drag-handle.directive';
import { IxDragDirective } from 'app/pages/common/ix-drop-grid/ix-drag.directive';
import { IxDropGridItemDirective } from 'app/pages/common/ix-drop-grid/ix-drop-grid-item.directive';
import { IxDropGridPlaceholderComponent } from 'app/pages/common/ix-drop-grid/ix-drop-grid-placeholder.component';
import { IxDropGridDirective } from 'app/pages/common/ix-drop-grid/ix-drop-grid.directive';

const directives = [
  IxDropGridDirective,
  IxDropGridPlaceholderComponent,
  IxDropGridItemDirective,
  IxDragDirective,
  IxDragHandleDirective,
];

@NgModule({
  imports: [
    DragDropModule,
  ],
  declarations: directives,
  exports: directives,
  providers: [
    {
      provide: CDK_DRAG_CONFIG,
      useValue: {} as DragDropConfig,
    },
  ],
})
export class IxDropGridModule {}
