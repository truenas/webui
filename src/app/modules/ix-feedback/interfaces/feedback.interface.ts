import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum FeedbackType {
  Review = 'REVIEW',
  Bug = 'BUG',
  Suggestion = 'FEATURE',
}

export const feedbackTypeOptionMap = new Map<FeedbackType, string>([
  [FeedbackType.Review, T('rate this page')],
  [FeedbackType.Bug, T('report a bug')],
  [FeedbackType.Suggestion, T('suggest an improvement')],
]);

export enum FeedbackEnvironment {
  Production = 'production',
  Development = 'development',
}

export interface Review {
  id: string;
  url: string;
  date_created: string;
  message: string;
  user_agent: string;
  environment: FeedbackEnvironment;
  rating: string;
  release: string;
  extra: object;
  host_u_id: string;
  attachments: string[];
}

export interface AddReview {
  rating: number;
  page: string;
  user_agent: string;
  release: string;
  environment: FeedbackEnvironment;
  host_u_id: string;
  message: string;
  extra: object;
}

export interface ReviewAddedResponse {
  review_id: number;
  success: boolean;
}

export interface AttachmentAddedResponse {
  message: string;
  data: {
    data_created: string;
    filename: string;
    id: number;
  };
}
