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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('benefit-packages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('benefit-packages')
export class BenefitPackagesController {
    employeesService: any;
    constructor(private benefitPackagesService: BenefitPackagesService) { }

    @ApiOperation({ summary: 'Get all benefit packages' })
    @Get()
    findAll() {
        return this.benefitPackagesService.findAll();
    }

    @Get('my')
    @Roles(UserRole.EMPLOYEE, UserRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get benefit packages enrolled by the logged-in employee' })
    findMyPackages(@CurrentUser() user: { id: number }) {
        return this.benefitPackagesService.findMyPackages(user.id);
    }

    @Get('my-company')
    @Roles(UserRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get all benefit packages for the HR manager company' })
    async findMyCompanyPackages(@CurrentUser() user: { id: number }) {
        const company = await this.employeesService.findCompanyByUserId(user.id);
        return this.benefitPackagesService.findByCompany(company.id);
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
    async updateBenefitPackage(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBenefitPackageDto,
        @CurrentUser() user: { id: number; role: UserRole },
    ) {
        if (user.role === UserRole.HR_MANAGER) {
            await this.benefitPackagesService.verifyOwnership(id, user.id);
        }
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