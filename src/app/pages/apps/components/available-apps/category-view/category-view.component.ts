import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  BehaviorSubject,
  map,
} from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-category-view',
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CustomAppButtonComponent,
    NgxSkeletonLoaderModule,
    AsyncPipe,
    TestDirective,
    AppCardComponent,
    TranslateModule,
    MatButton,
    TitleCasePipe,
    RouterLink,
  ],
})
export class CategoryViewComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private applicationsStore = inject(AppsStore);
  private appsFilterStore = inject(AppsFilterStore);

  protected readonly category = toSignal(this.activatedRoute.params.pipe(map((params) => params['category'] as string)));
  pageTitle$ = new BehaviorSubject('Category');
  apps$ = this.appsFilterStore.filteredApps$;
  isLoading$ = this.applicationsStore.isLoading$;

  ngOnInit(): void {
    const category = this.category();
    if (!category) {
      console.error('Missing category parameter');
      this.router.navigate(['/apps']);
      return;
    }

    this.pageTitle$.next(category.replace(/-/g, ' '));
    this.appsFilterStore.applyFilters({
      categories: [category],
      sort: null,
    });
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.latest_version}-${app.train}-${app.name}`;
  }
}
