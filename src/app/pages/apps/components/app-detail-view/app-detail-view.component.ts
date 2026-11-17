import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import {
  Gallery, GalleryItem, GalleryModule, ImageItem,
} from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { map } from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AppAvailableInfoCardComponent } from 'app/pages/apps/components/app-detail-view/app-available-info-card/app-available-info-card.component';
import { AppDetailsHeaderComponent } from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import { AppDetailsSimilarComponent } from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import { AppJsonDetailsCardComponent } from 'app/pages/apps/components/app-detail-view/app-json-details-card/app-json-details-card.component';
import { AppResourcesCardComponent } from 'app/pages/apps/components/app-detail-view/app-resources-card/app-resources-card.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@Component({
  selector: 'ix-app-detail-view',
  templateUrl: './app-detail-view.component.html',
  styleUrls: ['./app-detail-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    AppDetailsHeaderComponent,
    TranslateModule,
    NgxSkeletonLoaderModule,
    ImgFallbackModule,
    AppDetailsSimilarComponent,
    AppResourcesCardComponent,
    NgTemplateOutlet,
    AppAvailableInfoCardComponent,
    AppJsonDetailsCardComponent,
    LightboxModule,
    GalleryModule,
    TnTestIdDirective,
  ],
})
export class AppDetailViewComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private applicationsStore = inject(AppsStore);
  private gallery = inject(Gallery);
  private router = inject(Router);

  readonly appId = toSignal<string | undefined>(this.activatedRoute.params.pipe(map((params) => params['appId'])));
  readonly train = toSignal<string | undefined>(this.activatedRoute.params.pipe(map((params) => params['train'])));
  readonly isLoading = this.applicationsStore.isLoading;
  readonly app = computed<AvailableApp | null>(() => {
    const appId = this.appId();
    const train = this.train();
    return this.applicationsStore.availableApps().find((app) => app.name === appId && app.train === train) ?? null;
  });

  readonly imagePlaceholder = appImagePlaceholder;
  readonly items = signal<GalleryItem[]>([]);

  pageTitle = computed<string>(() => {
    const app = this.app();
    return app?.title || app?.name || this.translate.instant('...');
  });

  constructor() {
    effect(() => {
      // The catalog is emptied while it reloads, so only a loaded catalog can tell that the app is gone.
      if (!this.isLoading() && this.appId() && this.train() && !this.app()) {
        untracked(() => this.router.navigate(['/apps/installed']));
      }
    });
  }

  ngOnInit(): void {
    this.setLightbox();
  }

  private setLightbox(): void {
    const app = this.app();
    const images = app?.screenshots?.map((image) => new ImageItem({ src: image, thumb: image }));
    if (!images) {
      return;
    }

    this.items.set(images);
    this.gallery.ref('lightbox').load(this.items());
  }
}
