import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export function configureCloudinary(config: ConfigService) {
  const url = config.get<string>('CLOUDINARY_URL')?.trim();
  const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
  const apiKey = config.get<string>('CLOUDINARY_API_KEY')?.trim();
  const apiSecret = config.get<string>('CLOUDINARY_API_SECRET')?.trim();
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
          reject(
            new BadRequestException(
              error?.message
                ? `Cloudinary : ${error.message}`
                : 'Impossible d’envoyer le fichier sur Cloudinary.',
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
          reject(
            new BadRequestException('Impossible d’envoyer la photo sur Cloudinary.'),
          );
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
