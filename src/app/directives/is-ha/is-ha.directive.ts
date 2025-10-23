import { DestroyRef, Directive, TemplateRef, ViewContainerRef, OnInit, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

/**
 * Usage:
 * ```
 * <div *isHa="true"> Shown on HA licensed systems </div>
 * ```
 */
@Directive({
  selector: '[isHa]',
})
export class IsHaDirective implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private store$ = inject<Store<AppState>>(Store);

  isHa = input<boolean>(true);

  ngOnInit(): void {
    this.store$.select(selectIsHaLicensed).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isHa) => {
      this.viewContainer.clear();

      if (isHa === this.isHa()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
