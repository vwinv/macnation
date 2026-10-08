import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

const logger = new Logger('Cloudinary');

function envStr(config: ConfigService, key: string) {
  const raw = config.get<string>(key)?.trim();
  if (!raw) return undefined;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim() || undefined;
  }
  return raw;
}

function cloudinaryFailureMessage(
  error?: { message?: string; http_code?: number },
  fallback = 'Impossible d’envoyer la photo sur Cloudinary.',
) {
  const message = error?.message?.trim() || '';
  if (error?.http_code === 401 || /invalid signature/i.test(message)) {
    return 'Cloudinary refuse l’envoi : identifiants invalides. Vérifie CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans api_mac_nation/.env, puis relance l’API.';
  }
  return message ? `Cloudinary : ${message}` : fallback;
}

export function configureCloudinary(config: ConfigService) {
  const url = envStr(config, 'CLOUDINARY_URL');
  const cloudName = envStr(config, 'CLOUDINARY_CLOUD_NAME');
  const apiKey = envStr(config, 'CLOUDINARY_API_KEY');
  const apiSecret = envStr(config, 'CLOUDINARY_API_SECRET');
  cloudinary.config(true);
  if (url) {
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);
    if (!match) {
      throw new BadRequestException('CLOUDINARY_URL invalide.');
    }
    cloudinary.config({
      cloud_name: match[3],
      api_key: match[1],
      api_secret: match[2],
      secure: true,
    });
    return;
  }
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return;
  }
  throw new BadRequestException(
    'Cloudinary n’est pas configuré. Ajoute CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.',
  );
}

export function cloudinaryFolder(config: ConfigService) {
  return config.get<string>('CLOUDINARY_FOLDER')?.trim().replace(/^\/+|\/+$/g, '') || undefined;
}

export function careerFolder(config: ConfigService) {
  const root = cloudinaryFolder(config);
  return root ? `${root}/candidatures` : 'candidatures';
}

export function siteFolder(config: ConfigService) {
  const root = cloudinaryFolder(config);
  return root ? `${root}/site` : 'site';
}

export function uploadCareerFile(
  buffer: Buffer,
  originalName: string,
  mime: string,
  folder?: string,
) {
  const lower = (originalName || '').toLowerCase();
  const isImage =
    mime.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(lower);
  const isPdf = mime === 'application/pdf' || lower.endsWith('.pdf');
  const resource_type = isImage || isPdf ? 'image' : 'raw';

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...(folder ? { folder } : {}),
        resource_type,
        ...(isPdf ? { format: 'pdf' } : {}),
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          logger.error(error?.message || 'Upload Cloudinary sans URL');
          reject(
            new BadRequestException(
              cloudinaryFailureMessage(
                error,
                'Impossible d’envoyer le fichier sur Cloudinary.',
              ),
            ),
          );
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

export function uploadProductImage(buffer: Buffer, folder?: string) {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...(folder ? { folder } : {}),
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          logger.error(error?.message || 'Upload Cloudinary sans URL');
          reject(new BadRequestException(cloudinaryFailureMessage(error)));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

export function cloudinaryPublicId(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('cloudinary.com')) return null;
    const marker = '/image/upload/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx < 0) return null;
    let rest = parsed.pathname.slice(idx + marker.length);
    rest = rest.replace(/^v\d+\//, '');
    rest = rest.replace(/\.[a-z0-9]+$/i, '');
    return decodeURIComponent(rest) || null;
  } catch {
    return null;
  }
}

export async function destroyProductImage(url: string) {
  const id = cloudinaryPublicId(url);
  if (!id) return;
  try {
    await cloudinary.uploader.destroy(id);
  } catch {
    /* leftover is harmless */
  }
}
