import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { WebSocketDebugService } from './websocket-debug.service';

describe('WebSocketDebugService', () => {
  let service: WebSocketDebugService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WebSocketDebugService,
        provideMockStore(),
      ],
    });
    service = TestBed.inject(WebSocketDebugService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
