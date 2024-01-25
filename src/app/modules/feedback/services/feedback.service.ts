import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import html2canvas, { Options } from 'html2canvas';
import {
  BehaviorSubject,
  Observable, combineLatest, filter, first, map, of, switchMap, forkJoin, throwError,
} from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import {
  AddReview, AttachmentAddedResponse, ReviewAddedResponse,
} from 'app/modules/feedback/interfaces/feedback.interface';
import {
  CreateNewTicket,
  NewTicketResponse,
  SimilarIssue,
} from 'app/modules/feedback/interfaces/file-ticket.interface';
import { SnackbarConfig } from 'app/modules/snackbar/components/snackbar/snackbar-config.interface';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { SentryService } from 'app/services/sentry.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectSystemHostId, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  oauthToken$ = new BehaviorSubject<string>(null);
  private readonly hostname = 'https://feedback.ui.truenas.com';

  private isFeedbackAllowed: boolean;

  constructor(
    private httpClient: HttpClient,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private systemGeneralService: SystemGeneralService,
    private sentryService: SentryService,
    private fileUpload: IxFileUploadService,
    private matSnackBar: MatSnackBar,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {}

  getHostId(): Observable<string> {
    return this.store$.select(selectSystemHostId).pipe(filter(Boolean), take(1));
  }

  addReview(body: AddReview): Observable<ReviewAddedResponse> {
    return this.httpClient.post<ReviewAddedResponse>(`${this.hostname}/api/reviews/add/`, body);
  }

  addReviewAttachment(reviewId: number, image: File): Observable<AttachmentAddedResponse> {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post<AttachmentAddedResponse>(
      `${this.hostname}/api/reviews/${reviewId}/add-attachment/`,
      formData,
    );
  }

  takeScreenshot(filename = `${Date.now()}.png`, type = 'image/png', options?: Partial<Options>): Observable<File> {
    return new Observable((observer) => {
      html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        imageTimeout: 0,
        ignoreElements: (element) => element.classList.contains('cdk-overlay-container'),
        ...options,
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], filename, { type });
          observer.next(file);
          observer.complete();
        }, type);
      }).catch((error) => {
        observer.error(error);
      });
    });
  }

  getOauthToken(): string {
    return this.oauthToken$.getValue();
  }

  setOauthToken(token: string): void {
    this.oauthToken$.next(token);
  }

  checkIfReviewAllowed(): Observable<boolean> {
    if (this.isFeedbackAllowed !== undefined) {
      return of(this.isFeedbackAllowed);
    }
    return combineLatest([
      this.store$.pipe(waitForSystemInfo),
      this.systemGeneralService.getProductType$,
    ]).pipe(
      first(),
      switchMap(([systemInfo, productType]) => {
        const params = new HttpParams()
          .set('version', systemInfo.version)
          .set('product_type', productType);

        return this.httpClient
          .get<{ value: boolean }>(`${this.hostname}/api/collect-blacklist/check/`, { params })
          .pipe(
            map((response) => {
              this.isFeedbackAllowed = !response.value;
              return !response.value;
            }),
            catchError(() => {
              this.isFeedbackAllowed = false;
              return of(false);
            }),
          );
      }),
    );
  }

  getSimilarIssues(query: string): Observable<SimilarIssue[]> {
    return this.ws.call('support.similar_issues', [query]);
  }

  addDebugInfoToMessage(message: string): Observable<string> {
    return combineLatest([
      this.getHostId(),
      this.sentryService.sessionId$,
    ]).pipe(
      take(1),
      map(([hostId, sessionId]) => {
        const hostText = `Host ID: ${hostId}`;
        const sessionText = `Session ID: ${sessionId}`;
        return [message, hostText, sessionText].join('\n\n');
      }),
    );
  }

  createNewTicket(ticket: CreateNewTicket): Observable<NewTicketResponse> {
    return this.ws.job('support.new_ticket', [ticket]).pipe(
      filter((job) => job.state === JobState.Success),
      map((job) => job.result),
    );
  }

  addTicketAttachments({
    ticketId,
    token,
    attachments,
    takeScreenshot,
  }: {
    ticketId: number;
    attachments: File[];
    token?: string;
    takeScreenshot: boolean;
  }): Observable<void> {
    // Make requests and map to boolean for successful uploads.
    const requests = attachments.map((attachment) => {
      return this.addTicketAttachment({ ticketId, attachment, token });
    });

    if (takeScreenshot) {
      const takeScreenshotRequest$ = this.takeScreenshot().pipe(
        switchMap((screenshot) => this.addTicketAttachment({ ticketId, attachment: screenshot, token })),
      );
      requests.push(takeScreenshotRequest$);
    }

    if (requests.length === 0) {
      return of(undefined);
    }

    // TODO: Check what happens if more than 20 attachments are uploaded at the same time.
    return forkJoin(requests).pipe(
      switchMap((results) => {
        const wereAllImagesUploaded = results.every(Boolean);
        if (wereAllImagesUploaded) {
          return of(undefined);
        }

        return throwError(() => new Error('Not all images were uploaded.'));
      }),
    );
  }

  showSnackbar(ticketUrl?: string): MatSnackBarRef<SnackbarComponent> {
    const data: SnackbarConfig = {
      message: this.translate.instant(
        'Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.',
      ),
      icon: 'check',
      iconCssColor: 'var(--green)',
    };

    if (ticketUrl) {
      data.message = this.translate.instant('Thank you. Ticket was submitted succesfully.');
      data.button = {
        title: this.translate.instant('Open ticket'),
        action: () => this.window.open(ticketUrl, '_blank'),
      };
    }

    return this.matSnackBar.openFromComponent(SnackbarComponent, { data });
  }

  private addTicketAttachment({
    ticketId,
    attachment,
    token,
  }: {
    ticketId: number;
    attachment: File;
    token?: string;
  }): Observable<boolean> {
    return this.fileUpload.upload2(attachment, 'support.attach_ticket', [{
      token,
      ticket: ticketId,
      filename: attachment.name,
    }]).pipe(
      filter((event) => event instanceof HttpResponse),
      take(1),
      map(() => true),
      catchError((error: unknown) => {
        console.error(error);
        return of(false);
      }),
    );
  }
}
