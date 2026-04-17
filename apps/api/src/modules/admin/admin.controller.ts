import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
      search,
    );
  }

  @Get('activities')
  getActivities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getActivities(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post('roles')
  assignRole(@Body() body: { userId: string; role: string }) {
    return this.adminService.assignRole(body.userId, body.role as any);
  }

  @Delete('roles')
  removeRole(@Body() body: { userId: string; role: string }) {
    return this.adminService.removeRole(body.userId, body.role as any);
  }
}
