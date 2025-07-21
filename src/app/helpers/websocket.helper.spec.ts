import { TestBed } from '@angular/core/testing';
import { webSocket } from 'rxjs/webSocket';
import { WEBSOCKET } from './websocket.helper';

describe('WEBSOCKET InjectionToken', () => {
  it('provides rxjs webSocket', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(WEBSOCKET)).toBe(webSocket);
  });
});
