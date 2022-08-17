export type OauthMessage<T> = MessageEvent<{
  oauth_portal: boolean;
  error?: string;
  result?: T;
}>;
