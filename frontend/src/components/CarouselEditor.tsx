import { useState, useRef } from 'react';
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, Type } from 'lucide-react';
import { uploadApi } from '../services/api';
import toast from 'react-hot-toast';

export interface CarouselImage {
  id?: string;
  imageUrl: string;
  caption?: string;
  order: number;
}

interface CarouselEditorProps {
  images: CarouselImage[];
  onChange: (images: CarouselImage[]) => void;
  disabled?: boolean;
}

export default function CarouselEditor({ images, onChange, disabled }: CarouselEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`O arquivo ${file.name} não é uma imagem válida.`);
          continue;
        }

        const res = await uploadApi.image(file);
        newImages.push({
          imageUrl: res.data.url,
          caption: '',
          order: newImages.length,
        });
      }
      onChange(newImages);
      toast.success('Imagem(ns) carregada(s) com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    newImages.forEach((img, i) => { img.order = i; });
    onChange(newImages);
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const temp = newImages[index - 1];
    newImages[index - 1] = newImages[index];
    newImages[index] = temp;
    newImages.forEach((img, i) => { img.order = i; });
    onChange(newImages);
  };

  const moveRight = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[index + 1];
    newImages[index + 1] = newImages[index];
    newImages[index] = temp;
    newImages.forEach((img, i) => { img.order = i; });
    onChange(newImages);
  };

  const updateCaption = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    onChange(newImages);
  };

  return (
    <div>
      {/* Upload Zone */}
      <div
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        style={{
          border: '2px dashed',
          borderColor: disabled ? '#D1D5DB' : '#93C5FD',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#F9FAFB' : '#fff',
          transition: 'border-color 0.2s, background-color 0.2s',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseOver={e => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.backgroundColor = '#EFF6FF';
          }
        }}
        onMouseOut={e => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#93C5FD';
            e.currentTarget.style.backgroundColor = '#fff';
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
          <Upload size={28} style={{ color: uploading ? '#3B82F6' : '#93C5FD' }} />
          <p style={{ fontWeight: 500, color: '#374151', margin: 0, fontSize: '14px' }}>
            {uploading ? 'Fazendo upload...' : 'Clique ou arraste imagens aqui'}
          </p>
          <p style={{ fontSize: '12px', margin: 0, color: '#9CA3AF' }}>Formatos: JPG, PNG, WEBP (Max 5MB)</p>
        </div>
      </div>

      {/* Cards horizontais */}
      {images.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '8px',
            paddingTop: '20px',
            scrollBehavior: 'smooth',
          }}
        >
          {images.map((img, index) => (
            <div
              key={index}
              style={{
                minWidth: '240px',
                maxWidth: '240px',
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', width: '240px', height: '160px', backgroundColor: '#F3F4F6' }}>
                <img
                  src={img.imageUrl}
                  alt={`Card ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Badge de ordem */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {index + 1}
                </div>
                {/* Actions overlay */}
                {!disabled && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <button
                      onClick={() => removeImage(index)}
                      style={{
                        padding: '4px',
                        backgroundColor: '#EF4444',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remover"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {/* Move buttons */}
                {!disabled && images.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      left: '6px',
                      right: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <button
                      onClick={() => moveLeft(index)}
                      disabled={index === 0}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.3 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#374151',
                      }}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={() => moveRight(index)}
                      disabled={index === images.length - 1}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === images.length - 1 ? 0.3 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#374151',
                      }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Type size={13} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Legenda
                  </span>
                </div>
                <textarea
                  value={img.caption || ''}
                  onChange={e => updateCaption(index, e.target.value)}
                  disabled={disabled}
                  placeholder={`Texto do card ${index + 1}...`}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    backgroundColor: disabled ? '#F9FAFB' : '#fff',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    lineHeight: 1.4,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.10)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <p style={{ fontSize: '11px', color: '#B0B0B0', margin: '4px 0 0', lineHeight: 1.3 }}>
                  Use {'{{nome}}'} para personalizar
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div
          style={{
            padding: '40px 16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            textAlign: 'center',
            marginTop: '16px',
          }}
        >
          <ImageIcon size={32} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>Nenhuma imagem adicionada ao carrossel.</p>
        </div>
      )}
    </div>
  );
}
