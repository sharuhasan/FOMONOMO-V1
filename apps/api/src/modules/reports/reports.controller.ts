import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { reportedUserId?: string; reportedActivityId?: string; reason: string },
  ) {
    return this.reportsService.create(user.sub, body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.findAll(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
      status as any,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.reportsService.updateStatus(id, body.status as any);
  }
}
