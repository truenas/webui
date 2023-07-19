import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Gallery, GalleryItem, ImageItem } from 'ng-gallery';
import {
  map, filter, BehaviorSubject, tap, switchMap,
} from 'rxjs';
import { appImagePlaceholder, officialCatalog } from 'app/constants/catalog.constants';
import { AppDetailsRouteParams } from 'app/interfaces/app-details-route-params.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  templateUrl: './app-detail-view.component.html',
  styleUrls: ['./app-detail-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailViewComponent implements OnInit {
  app: AvailableApp;

  appId: string;
  catalog: string;
  train: string;

  isLoading$ = new BehaviorSubject<boolean>(true);
  readonly imagePlaceholder = appImagePlaceholder;
  readonly officialCatalog = officialCatalog;

  items: GalleryItem[];

  get pageTitle(): string {
    return this.app?.title || this.app?.name || this.translate.instant('...');
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private applicationsStore: AppsStore,
    private gallery: Gallery,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.listenForRouteChanges();
    this.setLightbox();
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params
      .pipe(
        filter((params) => {
          return !!(params.appId as string) && !!(params.catalog as string) && !!(params.train as string);
        }),
        tap(() => {
          this.isLoading$.next(true);
        }),
        untilDestroyed(this),
      )
      .subscribe(({ appId, catalog, train }: AppDetailsRouteParams) => {
        this.appId = appId;
        this.catalog = catalog;
        this.train = train;
        this.loadAppInfo();
      });
  }

  private loadAppInfo(): void {
    this.isLoading$.next(true);
    this.applicationsStore.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      switchMap(() => {
        return this.applicationsStore.availableApps$.pipe(
          map((apps: AvailableApp[]) => apps.find(
            (app) => app.name === this.appId && app.catalog === this.catalog && this.train === app.train,
          )),
        );
      }),
    ).pipe(untilDestroyed(this)).subscribe({
      next: (app) => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();

        if (app) {
          this.app = app;
        } else {
          this.router.navigate(['/apps/installed']);
        }
      },
      error: () => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      },
    });
  }

  setLightbox(): void {
    this.items = this.app?.screenshots?.map((image) => new ImageItem({ src: image, thumb: image }));
    this.gallery.ref('lightbox').load(this.items);
  }
}
