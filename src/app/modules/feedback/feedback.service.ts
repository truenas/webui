import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import html2canvas, { Options } from 'html2canvas';
import {
  BehaviorSubject,
  Observable, combineLatest, filter, first, map, of, switchMap, forkJoin, EMPTY,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import {
  AddReview, AttachmentAddedResponse,
} from 'app/modules/feedback/interfaces/feedback.interface';
import {
  CreateNewTicket,
  NewTicketResponse,
  SimilarIssue,
} from 'app/modules/feedback/interfaces/file-ticket.interface';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { SentryService } from 'app/services/sentry.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectSystemHostId, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';
import { ReviewAddedResponse } from './interfaces/feedback.interface';

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
  ) {}

  getHostId(): Observable<string> {
    return this.store$.select(selectSystemHostId).pipe(filter(Boolean));
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
    if (!this.getOauthToken()) {
      return of([]);
    }

    return this.ws.call('support.similar_issues', [this.getOauthToken(), query]);
  }

  addDebugInfoToMessage(message: string): Observable<string> {
    return forkJoin([
      this.getHostId(),
      this.sentryService.sessionId$,
    ]).pipe(
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

  addAttachmentsToTicket({
    ticketId,
    token,
    attachments,
    takeScreenshot,
  }: {
    ticketId: number;
    attachments: File[];
    token?: string;
    takeScreenshot: boolean;
  }): Observable<unknown[]> {
    return of(attachments).pipe(
      switchMap((images) => {
        // Optionally take a screenshot.
        if (!takeScreenshot) {
          return of(images);
        }

        return this.takeScreenshot().pipe(
          map((file) => [...images || [], file]),
        );
      }),
      switchMap((attachmentsToUpload) => {
        if (attachmentsToUpload.length === 0) {
          return EMPTY;
        }

        // TODO: Check what happens if more than 20 attachments are uploaded at the same time.
        const requests = attachmentsToUpload.map((attachment) => {
          return this.fileUpload.upload2(attachment, 'support.attach_ticket', [{
            token,
            ticket: ticketId,
            filename: attachment.name,
          }]).pipe(
            filter((event) => event instanceof HttpResponse),
          );
        });

        return forkJoin(requests);
      }),
    );
  }
}
