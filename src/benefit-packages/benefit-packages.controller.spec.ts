import { Test, TestingModule } from '@nestjs/testing';
import { BenefitPackagesController } from './benefit-packages.controller';

describe('BenefitPackagesController', () => {
  let controller: BenefitPackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenefitPackagesController],
    }).compile();

    controller = module.get<BenefitPackagesController>(BenefitPackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
