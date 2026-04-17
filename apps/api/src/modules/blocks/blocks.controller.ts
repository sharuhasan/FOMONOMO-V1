import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Blocks')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post(':userId')
  block(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.blocksService.block(user.sub, userId);
  }

  @Delete(':userId')
  unblock(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.blocksService.unblock(user.sub, userId);
  }

  @Get()
  getBlockedUsers(@CurrentUser() user: JwtPayload) {
    return this.blocksService.getBlockedUsers(user.sub);
  }

  @Get(':userId/status')
  async isBlocked(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    const blocked = await this.blocksService.isBlocked(user.sub, userId);
    return { blocked };
  }
}
