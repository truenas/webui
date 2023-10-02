import { Location } from '@angular/common';
import {
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
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Observable, Subscription, filter, merge, timer } from 'rxjs';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_CLOSER, SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { ChainedComponentSeralized, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in2',
  templateUrl: './ix-slide-in2.component.html',
  styleUrls: ['./ix-slide-in2.component.scss'],
})
export class IxSlideIn2Component implements OnInit, OnDestroy {
  @Input() componentInfo: ChainedComponentSeralized;
  @Input() index: number;
  @ViewChild('chainedBody', { static: true, read: ViewContainerRef }) slideInBody: ViewContainerRef;

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    this.onBackdropClicked();
  }

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;
  private wasBodyCleared = false;
  private timeOutOfClear: Subscription;
  counterId = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private location: Location,
    private router: Router,
    private chainedSlideInService: IxChainedSlideInService,
  ) {
    this.closeOnNavigation();
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
    this.componentInfo.close$.pipe(untilDestroyed(this)).subscribe(() => {
      this.closeSlideIn();
    });
  }

  onBackdropClicked(): void {
    if (!this.element || !this.isSlideInOpen) { return; }
    // this.close$.next(null);/
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
      });
      this.componentInfo.close$.next(null);
      this.chainedSlideInService.popComponent();
    });
  }

  openSlideIn<T, D>(
    componentType: Type<T>,
    params?: { wide?: boolean; data?: D },
  ): IxSlideInRef<T, D> {
    if (this.isSlideInOpen) {
      console.error('SlideIn is already open');
    }

    timer(10).pipe(untilDestroyed(this)).subscribe(() => {
      this.isSlideInOpen = true;
    });
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    this.wide = !!params?.wide;

    if (this.wasBodyCleared) {
      this.timeOutOfClear.unsubscribe();
    }
    this.slideInBody.clear();
    this.wasBodyCleared = false;
    // clear body and close all slides

    return this.createSlideInRef<T, D>(componentType, params?.data);
  }

  private createSlideInRef<T, D>(
    componentType: Type<T>,
    data?: D,
  ): IxSlideInRef<T, D> {
    const slideInRef = new IxSlideInRef<T, D>();
    const injector = Injector.create({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: data },
        { provide: SLIDE_IN_CLOSER, useValue: this.componentInfo.close$ },
      ],
    });
    slideInRef.componentRef = this.slideInBody.createComponent<T>(componentType, { injector });
    slideInRef.id = UUID.UUID();

    return slideInRef;
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.componentInfo.close$.next(null);
  }

  private closeOnNavigation(): void {
    merge(
      new Observable((observer) => {
        this.location.subscribe((event) => {
          observer.next(event);
        });
      }),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.componentInfo.close$.next(null);
      });
  }
}
