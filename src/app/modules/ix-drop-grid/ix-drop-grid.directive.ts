import {
  CDK_DRAG_CONFIG,
  CdkDragEnter,
  CdkDropListGroup,
  DragDropConfig,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  Directive,
  Inject, Injector,
  Input,
  OnInit, output,
  ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IxDropGridItemDirective } from 'app/modules/ix-drop-grid/ix-drop-grid-item.directive';
import { IxDropGridPlaceholderComponent } from 'app/modules/ix-drop-grid/ix-drop-grid-placeholder.component';
import { ixDropGridDirectiveToken } from 'app/modules/ix-drop-grid/ix-drop-grid.tokens';

@UntilDestroy()
@Directive({
  selector: '[ixDropGrid]',
  providers: [
    { provide: ixDropGridDirectiveToken, useExisting: this },
    {
      provide: CDK_DRAG_CONFIG,
      useValue: {} as DragDropConfig,
    },
  ],
  standalone: true,
})
export class IxDropGridDirective<T = unknown> extends CdkDropListGroup<IxDropGridItemDirective> implements OnInit {
  @Input() ixDropGridModel: T[];

  readonly ixDropGridModelChange = output<T[]>();

  placeholder: IxDropGridPlaceholderComponent;
  target: IxDropGridItemDirective;
  targetIndex: number;
  source: IxDropGridItemDirective;
  sourceIndex: number;

  constructor(
    public viewContainerRef: ViewContainerRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    super();
  }

  ngOnInit(): void {
    this.createPlaceholder();
  }

  registerPlaceholder(placeholderComponent: IxDropGridPlaceholderComponent): void {
    this.placeholder = placeholderComponent;
  }

  registerItem(itemDirective: IxDropGridItemDirective): void {
    itemDirective.entered.pipe(untilDestroyed(this)).subscribe(($event) => this.onItemEntered($event));
    itemDirective.dropped.pipe(untilDestroyed(this)).subscribe(() => this.onItemDropped());
  }

  onItemEntered(event: CdkDragEnter): void {
    const drag = event.item;
    const drop = event.container;

    if (drop === this.placeholder.itemInstance) {
      return;
    }

    const phElement = this.placeholder.itemInstance.element.nativeElement;
    const sourceElement = drag.dropContainer.element.nativeElement;
    const dropElement = drop.element.nativeElement;

    function indexOf(collection: HTMLCollection, node: HTMLElement): number {
      return Array.prototype.indexOf.call(collection, node);
    }

    const dragIndex = indexOf(
      dropElement.parentElement.children,
      this.source ? phElement : sourceElement,
    );
    const dropIndex = indexOf(
      dropElement.parentElement.children,
      dropElement,
    );

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = drag.dropContainer as IxDropGridItemDirective;

      phElement.style.width = `${dropElement.clientWidth}px`;
      phElement.style.height = `${dropElement.clientHeight}px`;

      sourceElement.parentElement.removeChild(sourceElement);
    }

    this.targetIndex = dropIndex;
    this.target = drop as IxDropGridItemDirective;

    phElement.style.display = '';
    dropElement.parentElement.insertBefore(
      phElement,
      dropIndex > dragIndex ? dropElement.nextSibling : dropElement,
    );

    this.document.defaultView.requestAnimationFrame(() => {
      this.placeholder.itemInstance._dropListRef.enter(
        drag._dragRef,
        drag.element.nativeElement.offsetLeft,
        drag.element.nativeElement.offsetTop,
      );
    });
  }

  onItemDropped(): void {
    if (!this.target) {
      return;
    }

    const phElement = this.placeholder.itemInstance.element.nativeElement;
    const parent = phElement.parentElement;

    phElement.style.display = 'none';

    parent.removeChild(phElement);
    parent.appendChild(phElement);
    parent.insertBefore(
      this.source.element.nativeElement,
      parent.children[this.sourceIndex],
    );

    this.target = null;
    this.source = null;

    if (this.sourceIndex !== this.targetIndex) {
      const newModel = [...this.ixDropGridModel];

      moveItemInArray(newModel, this.sourceIndex, this.targetIndex);

      this.ixDropGridModelChange.emit(newModel);
    }
  }

  private createPlaceholder(): IxDropGridPlaceholderComponent {
    const injector = Injector.create({
      providers: [{ provide: ixDropGridDirectiveToken, useValue: this }],
    });
    return this.viewContainerRef.createComponent(IxDropGridPlaceholderComponent, {
      injector,
      index: 0,
    }).instance;
  }
}
