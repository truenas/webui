import {
  ChangeDetectorRef,
  Directive, OnInit, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Directive({
  selector: '[ixIfNightly]',
  standalone: true,
})
export class IfNightlyDirective implements OnInit {
  private isNightly = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
  ) { }

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
