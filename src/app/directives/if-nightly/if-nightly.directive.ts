import { ChangeDetectorRef, Directive, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Directive({
  selector: '[ixIfNightly]',
})
export class IfNightlyDirective implements OnInit {
  private templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);

  private isNightly = false;

  ngOnInit(): void {
    this.store$.pipe(
      waitForSystemInfo,
      untilDestroyed(this),
    )
      .subscribe((systemInfo) => {
        this.viewContainer.clear();
        this.cdr.markForCheck();

        this.isNightly = systemInfo.version.includes('MASTER');
        if (!this.isNightly) {
          return;
        }

        this.viewContainer.createEmbeddedView(this.templateRef);
        this.cdr.markForCheck();
      });
  }
}
