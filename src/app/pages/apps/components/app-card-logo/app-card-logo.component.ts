import {
  ChangeDetectionStrategy, Component, inject, input,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  LAZYLOAD_IMAGE_HOOKS, LazyLoadImageModule, ScrollHooks, StateChange,
} from 'ng-lazyload-image';
import {
  fromEvent, merge, Observable, Subject,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-card-logo',
  templateUrl: './app-card-logo.component.html',
  styleUrls: ['./app-card-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LazyLoadImageModule],
  providers: [{ provide: LAZYLOAD_IMAGE_HOOKS, useClass: ScrollHooks }],
})
export class AppCardLogoComponent {
  url = input.required<string>();
  protected wasLogoLoaded = signal(false);

  private layoutService = inject(LayoutService);

  protected readonly scrollTarget = this.layoutService.getContentContainer();
  protected readonly appImagePlaceholder = appImagePlaceholder;

  protected readonly initialEmitter$ = new Subject<void>();
  protected readonly scroll$: Observable<Event | void>;

  constructor() {
    this.scroll$ = merge(
      fromEvent(this.scrollTarget, 'scroll'),
      this.initialEmitter$,
    );
    toObservable(this.url).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.initialEmitter$.next();
      },
    });
  }

  protected onLogoLoaded(event: StateChange): void {
    if (event.reason !== 'loading-succeeded') {
      return;
    }

    this.wasLogoLoaded.set(true);
  }
}
