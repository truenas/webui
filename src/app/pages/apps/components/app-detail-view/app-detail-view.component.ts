import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, filter, BehaviorSubject,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './app-detail-view.component.html',
  styleUrls: ['./app-detail-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailViewComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  appInfo: ChartRelease;
  appId: string;
  get pageTitle(): string {
    if (this.appInfo) {
      return this.appInfo.name;
    }

    if (this.appId) {
      return this.appId;
    }

    return this.translate.instant('Loading');
  }
  imagePlaceholder = appImagePlaceholder;

  isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private activatedRoute: ActivatedRoute,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
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
        untilDestroyed(this),
      )
      .subscribe((appId) => {
        this.appId = appId;
        this.loadAppInfo(appId);
      });
  }

  private loadAppInfo(appId: string): void {
    this.isLoading$.next(true);
    this.ws.call('chart.release.query', [[['id', '=', appId]]]).pipe(
      map((apps) => apps[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (appInfo) => {
        this.appInfo = appInfo;
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      },
    });
  }

  onInstallButtonPressed(): void {
    this.snackbar.success(
      this.translate.instant('Install Button Pressed'),
    );
  }
}
