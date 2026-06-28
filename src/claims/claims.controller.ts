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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
@Controller({ path: 'claims', version: '1' })
export class ClaimsController {
  constructor(
    private claimsService: ClaimsService,
    private employeesService: EmployeesService,
  ) {}

  @ApiOperation({ summary: 'Get all claims (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of all claims' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: FilterClaimsDto,
  ) {
    return this.claimsService.findAll(pagination, filters);
  }

  @Get('my-company-claims')
  @ApiOperation({
    summary: 'Get claims submitted by the employees in the HR manager company',
  })
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
  @ApiResponse({ status: 201, description: 'Claim submitted successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Post()
  createClaim(@Body() dto: CreateClaimDto, @CurrentUser() user) {
    return this.claimsService.createClaim(dto, user.id);
  }

  @ApiOperation({ summary: 'Review a claim (admin/HR only)' })
  @ApiResponse({ status: 200, description: 'Claim reviewed' })
  @ApiResponse({ status: 403, description: 'Forbidden — HR/admin only' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
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
