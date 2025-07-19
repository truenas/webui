import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { MockResponseService } from './mock-response.service';

describe('MockResponseService', () => {
  let service: MockResponseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockResponseService,
        provideMockStore(),
      ],
    });
    service = TestBed.inject(MockResponseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
