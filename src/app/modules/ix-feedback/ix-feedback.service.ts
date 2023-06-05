import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AddReview, AttachmentAddedResponse, Review, ReviewsResponse,
} from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { ReviewAddedResponse } from './interfaces/feedback.interface';

@Injectable()
export class IxFeedbackService {
  private readonly hostname = 'https://feedback.ui.truenas.com';
  private readonly token = '946bde8d85fc86c6c48344adf1ef2139';
  private headers = new HttpHeaders({
    Authorization: `Bearer ${this.token}`,
  });

  constructor(private httpClient: HttpClient) {}

  getReviews(): Observable<Review[]> {
    const params = new HttpParams()
      .set('per_page', '50')
      .set('page', '1');

    return this.httpClient.get<ReviewsResponse>(`${this.hostname}/api/reviews`, { params }).pipe(
      map((response) => response.data),
    );
  }

  addReview(body: AddReview): Observable<ReviewAddedResponse> {
    return this.httpClient.post<ReviewAddedResponse>(
      `${this.hostname}/api/reviews/add`,
      body,
      { headers: this.headers },
    );
  }

  addAttachment(reviewId: number, formData: FormData): Observable<AttachmentAddedResponse> {
    return this.httpClient.post<AttachmentAddedResponse>(
      `${this.hostname}/api/reviews/${reviewId}/add-attachment`,
      formData,
      {
        headers: this.headers,
      },
    );
  }

  getAttachment(reviewId: number, fileName: string): Observable<string> {
    return this.httpClient.get<string>(`${this.hostname}/static/${reviewId}/${fileName}`);
  }

  /**
   * Export Reviews
   * @returns Reviews in CSV
   */
  exportReviews(): Observable<unknown> {
    return this.httpClient.get(`${this.hostname}/api/reviews/export`);
  }
}
