import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { revieweeId: string; rating: number; text?: string; tags?: string[] },
  ) {
    return this.reviewsService.create(user.sub, body);
  }

  @Get('user/:id')
  getForUser(@Param('id') id: string) {
    return this.reviewsService.getForUser(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { rating?: number; text?: string; tags?: string[] },
  ) {
    return this.reviewsService.update(id, user.sub, body);
  }
}
