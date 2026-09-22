import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { findJob } from '../catalog/catalog.data';
import { NotifyService } from '../notify/notify.service';
import { StoreService } from '../store/store.service';
import type { UploadedDocument } from '../store/store.types';

const MAX_BYTES = 1_200_000;
/** Hard multer ceiling; the friendly 1,2 Mo message is enforced below. */
const HARD_LIMIT_BYTES = 10_000_000;

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

type MultipartFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type CareerFiles = {
  cv?: MultipartFile[];
  letterFile?: MultipartFile[];
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toDocument(file: MultipartFile): UploadedDocument {
  if (file.size > MAX_BYTES) {
    throw new BadRequestException('Fichier trop lourd. Maximum 1,2 Mo.');
  }
  const type = file.mimetype || 'application/pdf';
  if (
    !ALLOWED_TYPES.has(type) &&
    !/\.(pdf|docx?|jpe?g|png)$/i.test(file.originalname || '')
  ) {
    throw new BadRequestException('Envoie un PDF, Word, JPG ou PNG.');
  }
  return { name: file.originalname || '', type, bytes: file.buffer };
}

@Controller('career')
export class CareerController {
  private readonly logger = new Logger(CareerController.name);

  constructor(
    private readonly store: StoreService,
    private readonly notify: NotifyService,
  ) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'letterFile', maxCount: 1 },
      ],
      { limits: { fileSize: HARD_LIMIT_BYTES, files: 2 } },
    ),
  )
  async apply(
    @UploadedFiles() files: CareerFiles,
    @Body() body: Record<string, unknown>,
  ) {
    const job = findJob(text(body?.jobId));
    const name = text(body?.name);
    const phone = text(body?.phone);
    const email = text(body?.email);
    const letter = text(body?.letter);
    const cv = files?.cv?.[0];
    const letterFile = files?.letterFile?.[0];

    if (!job) throw new NotFoundException('Poste introuvable.');
    if (!name || !phone || !email) {
      throw new BadRequestException(
        'Indique ton nom, ton téléphone et ton email.',
      );
    }
    if (!letter && !letterFile) {
      throw new BadRequestException(
        'Ajoute une lettre de motivation (texte ou fichier).',
      );
    }
    if (!cv || cv.size === 0) {
      throw new BadRequestException('Ajoute ton CV (PDF, Word ou image).');
    }

    const application = await this.store.createApplication({
      jobId: job.id,
      jobTitle: job.title,
      name,
      phone,
      email,
      letter,
      cv: toDocument(cv),
      letterFile:
        letterFile && letterFile.size > 0 ? toDocument(letterFile) : undefined,
    });

    await this.notify.applicationCreated({
      name,
      phone,
      email,
      jobTitle: job.title,
    });

    return { ok: true, id: application.id };
  }
}
