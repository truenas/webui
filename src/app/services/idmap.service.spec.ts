import { TestBed, inject } from '@angular/core/testing';

import { IdmapService } from './idmap.service';

describe('IdmapService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IdmapService]
    });
  });

  it('should be created', inject([IdmapService], (service: IdmapService) => {
    expect(service).toBeTruthy();
  }));
});
