import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Directive({
  selector: '[isHa]',
})
export class IsHaDirective implements OnInit {
  isHa = input<boolean>(true);

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store$.select(selectIsHaLicensed).pipe(
      untilDestroyed(this),
    ).subscribe((isHa) => {
      this.viewContainer.clear();

      if (isHa === this.isHa()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
