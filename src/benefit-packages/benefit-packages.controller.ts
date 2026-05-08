import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/user.entity';
import { BenefitPackagesService } from './benefit-packages.service';
import { CreateBenefitPackageDto } from './dto/create-benefit-package.dto';
import { UpdateBenefitPackageDto } from './dto/update-benefit-package.dto';

@ApiTags('benefit-packages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('benefit-packages')
export class BenefitPackagesController {
    constructor(private benefitPackagesService: BenefitPackagesService) { }

    @ApiOperation({ summary: 'Get all benefit packages' })
    @Get()
    findAll() {
        return this.benefitPackagesService.findAll();
    }

    @ApiOperation({ summary: 'Get benefit package by id' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.benefitPackagesService.findOne(id);
    }

    @ApiOperation({ summary: 'Create a benefit package' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Post()
    createBenefitPackage(@Body() dto: CreateBenefitPackageDto) {
        return this.benefitPackagesService.createBenefitPackage(dto);
    }

    @ApiOperation({ summary: 'Update a benefit package' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Patch(':id')
    updateBenefitPackage(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBenefitPackageDto,
    ) {
        return this.benefitPackagesService.updateBenefitPackage(id, dto);
    }

    @ApiOperation({ summary: 'Remove a benefit package' })
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    removeBenefitPackage(@Param('id', ParseIntPipe) id: number) {
        return this.benefitPackagesService.removeBenefitPackage(id);
    }

    @ApiOperation({ summary: 'Enroll an employee in a benefit package' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Post(':id/enroll/:employeeId')
    enrollEmployee(
        @Param('id', ParseIntPipe) packageId: number,
        @Param('employeeId', ParseIntPipe) employeeId: number,
    ) {
        return this.benefitPackagesService.enrollEmployee(packageId, employeeId);
    }
}