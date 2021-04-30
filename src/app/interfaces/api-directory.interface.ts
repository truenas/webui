export type ApiDirectory = {
  'auth.login': { params: any; response: any };
  'auth.token': { params: any; response: string };
  'auth.logout': { params: any; response: any };

  'certificateauthority.query': { params: any; response: any };

  'system.info': { params: []; response: any };
};

export type ApiEndpoint = keyof ApiDirectory;
