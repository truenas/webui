import { TestBed, inject } from '@angular/core/testing';

import { JailService } from './jail.service';

describe('JailService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JailService]
    });
  });

  it('should be created', inject([JailService], (service: JailService) => {
    expect(service).toBeTruthy();
  }));
});
