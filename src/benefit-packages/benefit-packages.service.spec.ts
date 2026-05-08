import { Test, TestingModule } from '@nestjs/testing';
import { BenefitPackagesService } from './benefit-packages.service';

describe('BenefitPackagesService', () => {
  let service: BenefitPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BenefitPackagesService],
    }).compile();

    service = module.get<BenefitPackagesService>(BenefitPackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
