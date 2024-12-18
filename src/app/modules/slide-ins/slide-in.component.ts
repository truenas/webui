import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
  Type,
  ViewContainerRef,
  viewChild,
  input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Subscription, timer } from 'rxjs';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in',
  templateUrl: './slide-in.component.html',
  styleUrls: ['./slide-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CdkTrapFocus],
})
export class SlideInComponent implements OnInit, OnDestroy {
  readonly id = input<string>();

  private readonly slideInBody = viewChild('body', { read: ViewContainerRef });

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    this.onBackdropClicked();
  }

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;
  private wasBodyCleared = false;
  private timeOutOfClear: Subscription;

  constructor(
    private el: ElementRef,
    private slideInService: SlideInService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private defaultInjector: Injector,
  ) {
    this.element = this.el.nativeElement as HTMLElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id()) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);
    this.slideInService.setSlideComponent(this);
  }

  onBackdropClicked(): void {
    if (!this.element || !this.isSlideInOpen) {
      return;
    }
    this.slideInService.closeLast();
  }

  closeSlideIn(): void {
    this.isSlideInOpen = false;
    this.renderer.removeStyle(document.body, 'overflow');
    this.wasBodyCleared = true;
    this.cdr.markForCheck();
    this.timeOutOfClear = timer(200).pipe(untilDestroyed(this)).subscribe(() => {
      // Destroying child component later improves performance a little bit.
      // 200ms matches transition duration
      this.slideInBody().clear();
      this.wasBodyCleared = false;
      this.cdr.markForCheck();
    });
  }

  openSlideIn<T, D>(
    componentType: Type<T>,
    params?: { wide?: boolean; data?: D; injector?: Injector },
  ): SlideInRef<T, D> {
    if (this.isSlideInOpen) {
      console.error('SlideIn is already open');
    }

    this.isSlideInOpen = true;
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    this.wide = !!params?.wide;

    if (this.wasBodyCleared) {
      this.timeOutOfClear.unsubscribe();
    }
    this.slideInBody().clear();
    this.wasBodyCleared = false;
    // clear body and close all slides

    this.cdr.markForCheck();

    return this.createSlideInRef<T, D>(
      componentType,
      params?.data,
      params?.injector || this.defaultInjector,
    );
  }

  private createSlideInRef<T, D>(
    componentType: Type<T>,
    data?: D,
    parentInjector?: Injector,
  ): SlideInRef<T, D> {
    const slideInRef = new SlideInRef<T, D>();
    const injector = Injector.create({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: data },
        { provide: SlideInRef, useValue: slideInRef },
      ],
      parent: parentInjector,
    });
    slideInRef.componentRef = this.slideInBody().createComponent<T>(componentType, { injector });
    slideInRef.id = UUID.UUID();

    return slideInRef;
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.slideInService.closeAll();
  }
}
