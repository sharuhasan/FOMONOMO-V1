import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.uploadAvatar(user.sub, file);
  }

  @Post('presigned-url')
  getPresignedUrl(
    @CurrentUser() user: JwtPayload,
    @Body() body: { filename: string },
  ) {
    return this.uploadService.getPresignedUrl(user.sub, body.filename);
  }
}
