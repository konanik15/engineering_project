import {TestBed} from '@angular/core/testing';

import {UnoService} from './uno-service';

describe('UnoServiceService', () => {
  let service: UnoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
