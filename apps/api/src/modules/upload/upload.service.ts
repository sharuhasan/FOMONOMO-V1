import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // For now, store locally. Replace with S3 when configured.
    const s3Endpoint = this.config.get('S3_ENDPOINT');

    if (!s3Endpoint) {
      // Local/dev mode: return a placeholder URL
      const avatarUrl = `/uploads/avatars/${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;

      await this.prisma.profile.update({
        where: { userId },
        data: { avatarUrl },
      });

      return { avatarUrl, message: 'Avatar updated (local mode)' };
    }

    // TODO: S3 upload when credentials are configured
    // const s3 = new S3Client({ ... });
    // const key = `avatars/${userId}/${Date.now()}.${ext}`;
    // await s3.send(new PutObjectCommand({ ... }));

    return { avatarUrl: '', message: 'S3 not configured' };
  }

  async getPresignedUrl(userId: string, filename: string) {
    const s3Endpoint = this.config.get('S3_ENDPOINT');
    if (!s3Endpoint) {
      return { message: 'S3 not configured', url: null };
    }

    // TODO: Generate presigned URL when S3 is configured
    return { url: null, message: 'S3 not configured' };
  }
}
