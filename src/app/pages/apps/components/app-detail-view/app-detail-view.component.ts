import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, filter, BehaviorSubject, tap,
} from 'rxjs';
import { appImagePlaceholder, officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './app-detail-view.component.html',
  styleUrls: ['./app-detail-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailViewComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  app: AvailableApp;

  appId: string;
  catalog: string;
  train: string;

  isLoading$ = new BehaviorSubject<boolean>(false);
  readonly imagePlaceholder = appImagePlaceholder;
  readonly officialCatalog = officialCatalog;

  similarApps: AvailableApp[] = [];
  similarAppsLoading$ = new BehaviorSubject<boolean>(false);

  get pageTitle(): string {
    if (this.appId) {
      return this.appId;
    }

    if (this.app) {
      return this.app.name;
    }

    return this.translate.instant('Loading');
  }

  get description(): string {
    return this.app?.app_readme?.replace(/<[^>]*>/g, '');
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
    private router: Router,
    private translate: TranslateService,
    private appService: ApplicationsService,
    private applicationsStore: AvailableAppsStore,
  ) { }

  ngOnInit(): void {
    this.listenForRouteChanges();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params
      .pipe(
        filter((params) => {
          return !!(params.appId as string) && !!(params.catalog as string) && !!(params.train as string);
        }),
        tap(() => {
          this.isLoading$.next(true);
          this.similarAppsLoading$.next(true);
        }),
        untilDestroyed(this),
      )
      .subscribe(({ appId, catalog, train }: { appId: string; catalog: string; train: string }) => {
        this.appId = appId;
        this.catalog = catalog;
        this.train = train;
        this.loadAppInfo();
      });
  }

  private loadAppInfo(): void {
    this.isLoading$.next(true);
    this.applicationsStore.select((state) => state.availableApps).pipe(
      map((apps: AvailableApp[]) => apps.find(
        (app) => app.name === this.appId && app.catalog === this.catalog && this.train === app.train,
      )),
    )
      .pipe(untilDestroyed(this)).subscribe({
        next: (app) => {
          this.app = app;
          this.isLoading$.next(false);
          this.cdr.markForCheck();

          this.loadSimilarApps();
          this.loadScreenshots();
        },
        error: () => {
          this.isLoading$.next(false);
          this.cdr.markForCheck();
        },
      });
  }

  private loadSimilarApps(): void {
    this.similarAppsLoading$.next(true);
    this.appService.getAvailableApps().pipe(untilDestroyed(this)).subscribe({
      next: (apps) => {
        this.similarApps = apps.slice(0, 4);
        this.similarAppsLoading$.next(false);
      },
      error: () => {
        this.similarAppsLoading$.next(false);
      },
    });
  }

  private loadScreenshots(): void {
    console.warn('The Screenshot section is under construction.');
  }

  installButtonPressed(): void {
    this.router.navigate(['/apps', 'available', this.catalog, this.train, this.appId, 'install']);
  }
}
