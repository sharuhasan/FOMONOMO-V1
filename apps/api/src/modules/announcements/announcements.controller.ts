import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll() {
    return this.announcementsService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { title: string; message: string; type?: string },
  ) {
    return this.announcementsService.create(user.sub, body as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; message?: string; type?: string; isActive?: boolean },
  ) {
    return this.announcementsService.update(id, body as any);
  }
}
