import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash';
import { Subscription, timer } from 'rxjs';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import {
  ChainedComponentResponse,
  ChainedComponentSerialized,
  IxChainedSlideInService,
} from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in2',
  templateUrl: './ix-slide-in2.component.html',
  styleUrls: ['./ix-slide-in2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxSlideIn2Component implements OnInit, OnDestroy {
  @Input() componentInfo: ChainedComponentSerialized;
  @Input() index: number;
  @Input() lastIndex: number;
  @ViewChild('chainedBody', { static: true, read: ViewContainerRef }) slideInBody: ViewContainerRef;

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    this.onBackdropClicked();
  }

  get isTop(): boolean {
    return this.index === this.lastIndex;
  }

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;
  private wasBodyCleared = false;
  private timeOutOfClear: Subscription;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private chainedSlideInService: IxChainedSlideInService,
    private cdr: ChangeDetectorRef,
  ) {
    this.element = this.el.nativeElement as HTMLElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.componentInfo.id) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);
    if (this.componentInfo.component) {
      this.openSlideIn(this.componentInfo.component, {
        wide: this.componentInfo.wide, data: this.componentInfo.data,
      });
    }
    this.chainedSlideInService.isTopComponentWide$.pipe(
      untilDestroyed(this),
    ).subscribe((wide) => {
      this.wide = wide;
    });
  }

  ngOnDestroy(): void {
    this.componentInfo.close$.complete();
    this.chainedSlideInService.popComponent(this.componentInfo.id);
    this.element.remove();
  }

  onBackdropClicked(): void {
    if (!this.element || !this.isSlideInOpen) { return; }
    this.componentInfo.close$.next({ response: false, error: null });
    this.componentInfo.close$.complete();
    this.closeSlideIn();
  }

  closeSlideIn(): void {
    this.isSlideInOpen = false;
    // Delays are to give time for css transitions
    timer(100).pipe(untilDestroyed(this)).subscribe(() => {
      this.renderer.removeStyle(document.body, 'overflow');
      this.wasBodyCleared = true;
      this.timeOutOfClear = timer(100).pipe(untilDestroyed(this)).subscribe(() => {
        // Destroying child component later improves performance a little bit.
        // 200ms matches transition duration
        this.slideInBody.clear();
        this.wasBodyCleared = false;
        this.cdr.markForCheck();
      });
      this.chainedSlideInService.popComponent(this.componentInfo.id);
    });
  }

  openSlideIn<T, D>(
    componentType: Type<T>,
    params?: { wide?: boolean; data?: D },
  ): void {
    if (this.isSlideInOpen) {
      console.error('SlideIn is already open');
    }

    timer(10).pipe(untilDestroyed(this)).subscribe(() => {
      this.isSlideInOpen = true;
      this.cdr.markForCheck();
    });
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    this.wide = !!params?.wide;

    if (this.wasBodyCleared) {
      this.timeOutOfClear.unsubscribe();
    }
    this.slideInBody.clear();
    this.wasBodyCleared = false;
    // clear body and close all slides

    this.createInjector<T, D>(componentType, params?.data);
  }

  private createInjector<T, D>(
    componentType: Type<T>,
    data?: D,
  ): void {
    const injector = Injector.create({
      providers: [
        {
          provide: ChainedRef<D>,
          useValue: {
            close: (response: ChainedComponentResponse) => {
              this.componentInfo.close$.next(response);
              this.componentInfo.close$.complete();
              this.closeSlideIn();
            },
            swap: (component: Type<unknown>, wide = false, incomingComponentData?: unknown) => {
              this.chainedSlideInService.swapComponent({
                swapComponentId: this.componentInfo.id,
                component,
                wide,
                data: incomingComponentData,
              });
              this.closeSlideIn();
            },
            getData: (): D => {
              return cloneDeep(data);
            },
          } as ChainedRef<D>,
        },
      ],
    });
    this.slideInBody.createComponent<T>(componentType, { injector });
  }
}
