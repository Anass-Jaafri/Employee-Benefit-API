import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/users/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { ReviewClaimDto } from './dto/review-claim.dto';
import { EmployeesService } from 'src/employees/employees.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterClaimsDto } from './dto/filter-claims.dto';

@ApiTags('claims')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('claims')
export class ClaimsController {
  constructor(
    private claimsService: ClaimsService,
    private employeesService: EmployeesService,
  ) {}

  @ApiOperation({ summary: 'Get all claims (admin only)' })
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: FilterClaimsDto,
  ) {
    return this.claimsService.findAll(pagination, filters);
  }

  @Get('my-company-claims')
  @Roles(UserRole.HR_MANAGER)
  async findMyCompany(
    @CurrentUser() user: { id: number },
    @Query() filters: FilterClaimsDto,
  ) {
    const company = await this.employeesService.findCompanyByUserId(user.id);
    return this.claimsService.findByCompany(company.id, filters);
  }

  @Get('my-claims')
  @ApiOperation({ summary: 'Get claims submitted by the logged-in employee' })
  findMyClaims(@CurrentUser() user) {
    return this.claimsService.findMyClaims(user.id);
  }

  @ApiOperation({
    summary: 'Get remaining benefit amount for an employee in a package',
  })
  @Get('remaining/:packageId/:employeeId')
  getRemainingAmount(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return this.claimsService.getRemainingAmount(packageId, employeeId);
  }

  @ApiOperation({ summary: 'Get claim by id (admin/HR only)' })
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.claimsService.findOne(id);
  }

  @ApiOperation({ summary: 'Submit a claim' })
  @Post()
  createClaim(@Body() dto: CreateClaimDto, @CurrentUser() user) {
    return this.claimsService.createClaim(dto, user.id);
  }

  @ApiOperation({ summary: 'Review a claim (admin/HR only)' })
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @Patch(':id/review')
  reviewClaim(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewClaimDto,
    @CurrentUser() user,
  ) {
    return this.claimsService.reviewClaim(id, dto, user.id);
  }
}
