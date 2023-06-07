import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddReview,
} from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { ReviewAddedResponse } from './interfaces/feedback.interface';

@Injectable()
export class IxFeedbackService {
  private readonly hostname = 'https://feedback.ui.truenas.com';
  private readonly token = '946bde8d85fc86c6c48344adf1ef2139';

  constructor(private httpClient: HttpClient) {}

  addReview(body: AddReview): Observable<ReviewAddedResponse> {
    return this.httpClient.post<ReviewAddedResponse>(
      `${this.hostname}/api/reviews/add/`,
      body,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.token}`,
        }),
      },
    );
  }
}
