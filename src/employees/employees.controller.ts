import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { EmployeesService } from './employees.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private employeesService: EmployeesService) { }

    @ApiOperation({ summary: 'Get all employees' })
    @Get()
    getEmployees() {
        return this.employeesService.findAll();
    }

    @ApiOperation({ summary: 'Get employee by id' })
    @Get(':id')
    getEmployeeById(@Param('id', ParseIntPipe) id: number) {

        return this.employeesService.findOne(id);
    }

    @ApiOperation({ summary: 'Create employee' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Post()
    createEmployee(@Body() data: CreateEmployeeDto) {
        return this.employeesService.createEmployee(data);
    }

    @ApiOperation({ summary: 'Update employee details' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Patch(':id')
    updateEmployee(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateEmployeeDto,
    ) {
        return this.employeesService.updateEmployee(id, body);
    }

    @ApiOperation({ summary: 'Delete employee' })
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    removeEmployee(@Param('id', ParseIntPipe) id: number) {
        return this.employeesService.removeEmployee(id);
    }

}
