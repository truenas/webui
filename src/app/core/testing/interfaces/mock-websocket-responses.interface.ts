import { Observable } from 'rxjs';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';

export type MockWebsocketResponses = {
  [K in ApiMethod]?: Observable<ApiDirectory[K]['response']>;
};
