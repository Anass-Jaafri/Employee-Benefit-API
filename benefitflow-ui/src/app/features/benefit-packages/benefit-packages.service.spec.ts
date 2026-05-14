import { TestBed } from '@angular/core/testing';

import { BenefitPackagesService } from './benefit-packages.service';

describe('BenefitPackagesService', () => {
  let service: BenefitPackagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BenefitPackagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
