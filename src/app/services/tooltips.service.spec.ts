import { TestBed, inject } from '@angular/core/testing';

import { TooltipsService } from './tooltips.service';

describe('TooltipsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TooltipsService]
    });
  });

  it('should be created', inject([TooltipsService], (service: TooltipsService) => {
    expect(service).toBeTruthy();
  }));
});
