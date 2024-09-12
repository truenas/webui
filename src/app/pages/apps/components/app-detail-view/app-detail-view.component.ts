import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
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
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
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
  readonly appId = input.required<string>();
  readonly train = input.required<string>();
  readonly isLoading = signal(true);
  readonly imagePlaceholder = appImagePlaceholder;

  items: GalleryItem[];

  pageTitle = computed<string>(() => {
    return this.app()?.title || this.app?.name || this.translate.instant('...');
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private applicationsStore: AppsStore,
    private gallery: Gallery,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.setLightbox();
  }

  private loadAppInfo(): void {
    this.isLoading.set(true);
    this.applicationsStore.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      switchMap(() => {
        return this.applicationsStore.availableApps$.pipe(
          map((apps: AvailableApp[]) => apps.find(
            (app) => app.name === this.appId() && this.train() === app.train,
          )),
        );
      }),
    ).pipe(untilDestroyed(this)).subscribe({
      next: (app) => {
        this.isLoading.set(false);
        this.cdr.markForCheck();

        if (!app) {
          this.router.navigate(['/apps/installed']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  setLightbox(): void {
    this.items = this.app()?.screenshots?.map((image) => new ImageItem({ src: image, thumb: image }));
    this.gallery.ref('lightbox').load(this.items);
  }
}
