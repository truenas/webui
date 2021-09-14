export type OauthMessage<T = any> = MessageEvent<{
  oauth_portal: boolean;
  error?: string;
  result?: T;
}>;
