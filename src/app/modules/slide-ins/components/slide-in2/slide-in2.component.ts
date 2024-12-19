import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, computed,
  ElementRef,
  HostListener,
  Injector, input,
  OnDestroy,
  OnInit,
  Renderer2,
  Type,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import {
  filter, Observable, of, Subscription, switchMap, timer,
} from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import {
  ChainedComponentResponse,
  ChainedComponentSerialized,
  ChainedSlideInService,
} from 'app/services/chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in2',
  templateUrl: './slide-in2.component.html',
  styleUrls: ['./slide-in2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CdkTrapFocus],
})
export class SlideIn2Component implements OnInit, OnDestroy {
  readonly componentInfo = input<ChainedComponentSerialized>();
  readonly index = input<number>();
  readonly lastIndex = input<number>();

  private readonly slideInBody = viewChild('chainedBody', { read: ViewContainerRef });
  private needConfirmation: () => Observable<boolean>;

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    this.onBackdropClicked();
  }

  protected isTop = computed(() => {
    return this.index() === this.lastIndex();
  });

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;
  private wasBodyCleared = false;
  private timeOutOfClear: Subscription;

  constructor(
    private el: ElementRef,
    private dialogService: DialogService,
    private translate: TranslateService,
    private renderer: Renderer2,
    private chainedSlideInService: ChainedSlideInService,
    private cdr: ChangeDetectorRef,
  ) {
    this.element = this.el.nativeElement as HTMLElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.componentInfo().id) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);
    if (this.componentInfo().component) {
      this.openSlideIn(this.componentInfo().component, {
        wide: this.componentInfo().wide, data: this.componentInfo().data,
      });
    }
    this.chainedSlideInService.isTopComponentWide$.pipe(
      untilDestroyed(this),
    ).subscribe((wide) => {
      this.wide = wide;
    });
  }

  ngOnDestroy(): void {
    this.chainedSlideInService.popComponent(this.componentInfo().id);
    this.element.remove();
  }

  onBackdropClicked(): void {
    if (!this.element || !this.isSlideInOpen) {
      return;
    }

    this.canCloseSlideIn().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.componentInfo().close$.next({ response: false, error: null });
        this.componentInfo().close$.complete();
        this.closeSlideIn();
      },
    });
  }

  closeSlideIn(): void {
    this.isSlideInOpen = false;
    this.renderer.removeStyle(document.body, 'overflow');
    this.wasBodyCleared = true;
    this.timeOutOfClear = timer(255).pipe(untilDestroyed(this)).subscribe(() => {
      // Destroying child component later improves performance a little bit.
      // 255ms matches transition duration
      this.slideInBody().clear();
      this.wasBodyCleared = false;
      this.cdr.markForCheck();
      timer(50).pipe(
        untilDestroyed(this),
      ).subscribe({
        next: () => this.chainedSlideInService.popComponent(this.componentInfo().id),
      });
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
    this.slideInBody().clear();
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
            close: (response: ChainedComponentResponse): void => {
              (!response.response ? this.canCloseSlideIn() : of(true)).pipe(
                filter(Boolean),
                untilDestroyed(this),
              ).subscribe({
                next: () => {
                  this.componentInfo().close$.next(response);
                  this.componentInfo().close$.complete();
                  this.closeSlideIn();
                },
              });
            },
            swap: (component: Type<unknown>, wide = false, incomingComponentData?: unknown): void => {
              this.canCloseSlideIn().pipe(
                filter(Boolean),
                untilDestroyed(this),
              ).subscribe({
                next: () => {
                  this.chainedSlideInService.swapComponent({
                    swapComponentId: this.componentInfo().id,
                    component,
                    wide,
                    data: incomingComponentData,
                  });
                  this.closeSlideIn();
                },
              });
            },
            getData: (): D => {
              return cloneDeep(data);
            },
            requireConfirmationWhen: (needConfirmation: () => Observable<boolean>): void => {
              this.needConfirmation = needConfirmation;
            },
          } as ChainedRef<D>,
        },
      ],
    });
    this.slideInBody().createComponent<T>(componentType, { injector });
  }

  private canCloseSlideIn(): Observable<boolean> {
    if (!this.needConfirmation) {
      return of(true);
    }

    return this.needConfirmation().pipe(
      switchMap((needConfirmation) => (needConfirmation ? this.showConfirmDialog() : of(true))),
    );
  }

  private showConfirmDialog(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant('Unsaved Changes'),
      message: this.translate.instant('You have unsaved changes. Are you sure you want to close?'),
      cancelText: this.translate.instant('No'),
      buttonText: this.translate.instant('Yes'),
      buttonColor: 'red',
      hideCheckbox: true,
    });
  }
}
