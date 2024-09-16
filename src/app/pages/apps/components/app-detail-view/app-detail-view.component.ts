import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
  input,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Gallery, GalleryItem, ImageItem } from 'ng-gallery';
import {
  map, filter, switchMap,
  tap,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { AppDetailsRouteParams } from 'app/interfaces/app-details-route-params.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-detail-view',
  templateUrl: './app-detail-view.component.html',
  styleUrls: ['./app-detail-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailViewComponent implements OnInit {
  readonly app = input<AvailableApp>();
  readonly appId = signal<string>('');
  readonly train = signal<string>('');
  readonly isLoading = signal(true);
  readonly imagePlaceholder = appImagePlaceholder;
  readonly items = signal<GalleryItem[]>([]);

  pageTitle = computed<string>(() => {
    const app = this.app();
    return app?.title || app?.name || this.translate.instant('...');
  });

  constructor(
    private activatedRoute: ActivatedRoute,
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
    // TODO: Update when `input()` will have support for router params
    this.activatedRoute.params
      .pipe(
        filter((params) => {
          return !!(params.appId as string) && !!(params.train as string);
        }),
        tap(() => this.isLoading.set(true)),
        untilDestroyed(this),
      )
      .subscribe(({ appId, train }: AppDetailsRouteParams) => {
        this.appId.set(appId);
        this.train.set(train);
        this.loadAppInfo();
      });
  }

  private loadAppInfo(): void {
    this.isLoading.set(true);
    this.applicationsStore.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      switchMap(() => {
        return this.applicationsStore.availableApps$.pipe(
          map((apps: AvailableApp[]) => {
            const appId = this.appId();
            const train = this.train();
            return apps.find((app) => app.name === appId && app.train === train);
          }),
        );
      }),
    ).pipe(untilDestroyed(this)).subscribe({
      next: (app) => {
        this.isLoading.set(false);

        if (!app) {
          this.router.navigate(['/apps/installed']);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  setLightbox(): void {
    const app = this.app();
    const images = app?.screenshots?.map((image) => new ImageItem({ src: image, thumb: image }));
    this.items.set(images);
    this.gallery.ref('lightbox').load(this.items());
  }
}
