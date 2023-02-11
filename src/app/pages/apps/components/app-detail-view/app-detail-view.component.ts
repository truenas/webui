import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, filter, BehaviorSubject, tap,
} from 'rxjs';
import { appImagePlaceholder, chartsTrain, officialCatalog } from 'app/constants/catalog.constants';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { catalogToAppsTransform } from 'app/pages/apps/utils/catalog-to-apps-transform';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './app-detail-view.component.html',
  styleUrls: ['./app-detail-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailViewComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  app: CatalogApp;
  appId: string;
  isLoading$ = new BehaviorSubject<boolean>(false);
  readonly imagePlaceholder = appImagePlaceholder;
  readonly officialCatalog = officialCatalog;

  similarApps: CatalogApp[] = [];
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
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private appService: ApplicationsService,
  ) {

  }

  ngOnInit(): void {
    this.listenForRouteChanges();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params
      .pipe(
        map((params) => params.appId as string),
        filter(Boolean),
        tap(() => {
          this.isLoading$.next(true);
          this.similarAppsLoading$.next(true);
        }),
        untilDestroyed(this),
      )
      .subscribe((appId) => {
        this.appId = appId;
        this.loadAppInfo();
      });
  }

  private loadAppInfo(): void {
    this.isLoading$.next(true);
    this.appService
      .getCatalogItem(this.appId, officialCatalog, chartsTrain)
      .pipe(
        untilDestroyed(this),
      ).subscribe({
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
    this.appService.getAllCatalogs().pipe(
      catalogToAppsTransform(),
      untilDestroyed(this),
    ).subscribe({
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

  onInstallButtonPressed(): void {
    this.snackbar.success(
      this.translate.instant('Install Button Pressed'),
    );
  }
}
