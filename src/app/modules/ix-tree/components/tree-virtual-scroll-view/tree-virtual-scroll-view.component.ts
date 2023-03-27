import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
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
  TrackByFunction,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { animationFrameScheduler, asapScheduler, BehaviorSubject } from 'rxjs';
import { auditTime, map } from 'rxjs/operators';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { Tree } from 'app/modules/ix-tree/components/tree/tree.component';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { TreeVirtualNodeData } from 'app/modules/ix-tree/interfaces/tree-virtual-node-data.interface';

export const defaultSize = 48;
export const scrollFrameScheduler = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;

@UntilDestroy()
@Component({
  selector: 'ix-tree-virtual-scroll-view',
  exportAs: 'ixTreeVirtualScrollView',
  templateUrl: './tree-virtual-scroll-view.component.html',
  styleUrls: ['./tree-virtual-scroll-view.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: CdkTree, useExisting: this },
    { provide: Tree, useExisting: this },
  ],
})
export class TreeVirtualScrollViewComponent<T> extends Tree<T> implements OnChanges {
  @ViewChild(TreeNodeOutletDirective, { static: true }) readonly nodeOutlet!: TreeNodeOutletDirective<T>;
  @ViewChild(CdkVirtualScrollViewport, { static: true }) readonly virtualScrollViewport!: CdkVirtualScrollViewport;
  @HostBinding('class.ix-tree') get ixTreeClass(): boolean { return true; }
  @Input() ixItemSize = defaultSize;
  @Input() ixMinBufferPx = defaultSize * 4;
  @Input() ixMaxBufferPx = defaultSize * 8;
  @Input() override trackBy!: TrackByFunction<T>;
  nodes$ = new BehaviorSubject<TreeVirtualNodeData<T>[]>([]);
  innerTrackBy: TrackByFunction<TreeVirtualNodeData<T>> = (index: number) => index;
  private renderNodeChanges$ = new BehaviorSubject<T[] | readonly T[]>([]);

  get isScrollTopButtonVisible(): boolean {
    return this.virtualScrollViewport.measureScrollOffset('top') > this.ixItemSize * 8;
  }

  constructor(
    protected differs: IterableDiffers,
    protected changeDetectorRef: ChangeDetectorRef,
  ) {
    super(differs, changeDetectorRef);
    this.listenForNodeChanges();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
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

  private createNode(nodeData: T, index: number): TreeVirtualNodeData<T> {
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

  private listenForNodeChanges(): void {
    this.renderNodeChanges$.pipe(
      auditTime(0, scrollFrameScheduler),
      map((data) => [...data].map((node, index) => this.createNode(node, index))),
      untilDestroyed(this),
    ).subscribe((nodes) => {
      this.nodes$.next(nodes);
      this._dataSourceChanged.next();
      this.changeDetectorRef.markForCheck();
    });
  }
}
