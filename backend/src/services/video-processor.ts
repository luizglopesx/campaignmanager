import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';

const TEMP_DIR = path.join(os.tmpdir(), 'cm-video-processing');

// Garante que a pasta temporária existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  codec: string;
  format: string;
}

/**
 * Obtém informações de um vídeo a partir de um buffer
 */
export function getVideoInfo(inputPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) return reject(new Error('Nenhum stream de vídeo encontrado'));

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        codec: videoStream.codec_name || '',
        format: metadata.format.format_name || '',
      });
    });
  });
}

/**
 * Processa vídeo para Status do WhatsApp:
 * - Limita a 30 segundos
 * - Converte para MP4 (H.264 + AAC)
 * - Redimensiona para max 720p (mantendo aspect ratio)
 *
 * Retorna o buffer do vídeo processado
 */
export async function processVideoForStatus(inputBuffer: Buffer): Promise<{
  buffer: Buffer;
  duration: number;
  wasProcessed: boolean;
}> {
  const inputFile = path.join(TEMP_DIR, `input-${Date.now()}-${Math.random().toString(36).substring(7)}.tmp`);
  const outputFile = path.join(TEMP_DIR, `output-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);

  try {
    // Salvar buffer no disco temporário
    fs.writeFileSync(inputFile, inputBuffer);

    // Obter info do vídeo
    const info = await getVideoInfo(inputFile);
    console.log(`📹 Vídeo original: ${info.duration.toFixed(1)}s, ${info.width}x${info.height}, codec: ${info.codec}`);

    // Verificar se precisa processar
    const needsTrim = info.duration > 30;
    const needsResize = info.width > 720 || info.height > 720;
    const needsReencode = info.codec !== 'h264';
    const needsProcessing = needsTrim || needsResize || needsReencode;

    if (!needsProcessing) {
      console.log('✅ Vídeo já está no formato correto, sem processamento necessário');
      const buffer = fs.readFileSync(inputFile);
      return { buffer, duration: info.duration, wasProcessed: false };
    }

    // Processar com ffmpeg
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(inputFile)
        .outputOptions([
          '-c:v', 'libx264',     // Codec H.264
          '-c:a', 'aac',         // Codec AAC
          '-preset', 'fast',     // Velocidade de encoding
          '-crf', '28',          // Qualidade (mais alto = menor qualidade/tamanho)
          '-movflags', '+faststart', // Otimização para streaming
        ]);

      // Limitar a 30 segundos
      if (needsTrim) {
        command = command.setDuration(30);
      }

      // Redimensionar mantendo aspect ratio (max 720p)
      if (needsResize) {
        command = command.videoFilters([
          `scale='min(720,iw)':'min(720,ih)':force_original_aspect_ratio=decrease`,
          `pad='ceil(iw/2)*2':'ceil(ih/2)*2'`, // Garantir dimensões pares (requisito H.264)
        ]);
      }

      command
        .output(outputFile)
        .on('start', (cmd) => {
          console.log(`🎬 ffmpeg: ${cmd}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`🎬 Processando: ${progress.percent.toFixed(0)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Vídeo processado com sucesso');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Erro no ffmpeg:', err.message);
          reject(err);
        })
        .run();
    });

    // Ler o resultado
    const buffer = fs.readFileSync(outputFile);
    const outputInfo = await getVideoInfo(outputFile);

    console.log(`📹 Vídeo processado: ${outputInfo.duration.toFixed(1)}s, ${outputInfo.width}x${outputInfo.height}`);

    return {
      buffer,
      duration: outputInfo.duration,
      wasProcessed: true,
    };
  } finally {
    // Limpar arquivos temporários
    try { fs.unlinkSync(inputFile); } catch {}
    try { fs.unlinkSync(outputFile); } catch {}
  }
}

/**
 * Limpa arquivos temporários antigos (>1h)
 */
export function cleanupTempFiles(): void {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {}
}
