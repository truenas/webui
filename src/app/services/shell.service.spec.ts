import { TestBed, inject } from '@angular/core/testing';

import { ShellService } from './shell.service';

describe('ShellService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShellService]
    });
  });

  it('should be created', inject([ShellService], (service: ShellService) => {
    expect(service).toBeTruthy();
  }));
});
