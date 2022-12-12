import { CdkVirtualScrollViewport, DEFAULT_SCROLL_TIME } from '@angular/cdk/scrolling';
import {
  CdkTree, CdkTreeNodeOutletContext,
} from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  IterableDiffers,
  OnChanges,
  SimpleChanges,
  TrackByFunction,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { IxTree } from 'app/modules/ix-tree/components/ix-tree/ix-tree.component';
import { IxTreeNodeOutletDirective } from 'app/modules/ix-tree/directives/ix-tree-node-outlet.directive';
import { IxTreeVirtualNodeData } from 'app/modules/ix-tree/interfaces/ix-tree-virtual-node-data.interface';

export const defaultSize = 48;

@UntilDestroy()
@Component({
  selector: 'ix-tree-virtual-scroll-view',
  exportAs: 'ixTreeVirtualScrollView',
  templateUrl: './ix-tree-virtual-scroll-view.component.html',
  styleUrls: ['./ix-tree-virtual-scroll-view.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: CdkTree, useExisting: IxTreeVirtualScrollViewComponent },
    { provide: IxTree, useExisting: IxTreeVirtualScrollViewComponent },
  ],
})
export class IxTreeVirtualScrollViewComponent<T> extends IxTree<T> implements OnChanges {
  @ViewChild(IxTreeNodeOutletDirective, { static: true }) readonly nodeOutlet!: IxTreeNodeOutletDirective<T>;
  @ViewChild(CdkVirtualScrollViewport, { static: true }) readonly virtualScrollViewport!: CdkVirtualScrollViewport;
  @HostBinding('class.ix-tree') get ixTreeClass(): boolean { return true; }
  @Input() ixItemSize = defaultSize;
  @Input() ixMinBufferPx = defaultSize * 4;
  @Input() ixMaxBufferPx = defaultSize * 8;
  @Input() override trackBy!: TrackByFunction<T>;
  nodes$ = new BehaviorSubject<IxTreeVirtualNodeData<T>[]>([]);
  innerTrackBy: TrackByFunction<IxTreeVirtualNodeData<T>> = (index: number) => index;
  private renderNodeChanges$ = new BehaviorSubject<T[] | readonly T[]>([]);

  get isScrollTopButtonVisible(): boolean {
    return this.virtualScrollViewport.measureScrollOffset('top') > this.ixItemSize;
  }

  constructor(
    protected differs: IterableDiffers,
    protected changeDetectorRef: ChangeDetectorRef,
  ) {
    super(differs, changeDetectorRef);
    this.renderNodeChanges$.pipe(
      debounceTime(DEFAULT_SCROLL_TIME),
      map((data) => [...data].map((node, index) => this.createNode(node, index))),
      untilDestroyed(this),
    ).subscribe((nodes) => {
      this.nodes$.next(nodes);
      this._dataSourceChanged.next();
      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.trackBy) {
      if (typeof changes.trackBy.currentValue === 'function') {
        this.innerTrackBy = (index: number, node) => this.trackBy(index, node.data);
      } else {
        this.innerTrackBy = (index: number) => index;
      }
    }
  }

  scrollToTop(): void {
    this.virtualScrollViewport.scrollToIndex(0, 'smooth');
    this.changeDetectorRef.markForCheck();
  }

  override renderNodeChanges(data: T[] | readonly T[]): void {
    this.renderNodeChanges$.next(data);
  }

  private createNode(nodeData: T, index: number): IxTreeVirtualNodeData<T> {
    const node = this._getNodeDef(nodeData, index);
    const context = new CdkTreeNodeOutletContext<T>(nodeData);
    if (this.treeControl.getLevel) {
      context.level = this.treeControl.getLevel(nodeData);
    } else {
      context.level = 0;
    }
    return {
      data: nodeData,
      context,
      nodeDef: node,
    };
  }
}
