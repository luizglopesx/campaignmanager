import { useState, useRef } from 'react';
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { uploadApi } from '../services/api';
import toast from 'react-hot-toast';

interface CarouselImage {
  id?: string;
  imageUrl: string;
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
    // Reordenar
    newImages.forEach((img, i) => { img.order = i; });
    onChange(newImages);
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const temp = newImages[index - 1];
    newImages[index - 1] = newImages[index];
    newImages[index] = temp;
    
    // Atualiza prop order
    newImages.forEach((img, i) => { img.order = i; });
    onChange(newImages);
  };

  const moveRight = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[index + 1];
    newImages[index + 1] = newImages[index];
    newImages[index] = temp;

    // Atualiza prop order
    newImages.forEach((img, i) => { img.order = i; });
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div 
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed bg-surface-50 border-surface-200' : 
          'cursor-pointer border-primary-200 hover:bg-primary-50/50 hover:border-primary-400 bg-white'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-text-muted">
          <Upload size={32} className={uploading ? 'animate-bounce text-primary-400' : 'text-primary-300'} />
          <p className="font-medium text-text-primary">
            {uploading ? 'Fazendo upload...' : 'Clique ou arraste imagens aqui'}
          </p>
          <p className="text-sm">Formatos suportados: JPG, PNG, WEBP (Máx 5MB)</p>
        </div>
      </div>

      {/* Grid de Imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group bg-surface-50 rounded-xl overflow-hidden border border-surface-200 aspect-square">
              <img src={img.imageUrl} alt={`Carousel ${index + 1}`} className="w-full h-full object-cover" />
              
              {!disabled && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => removeImage(index)}
                      className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                      title="Remover"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <button 
                      onClick={() => moveLeft(index)}
                      disabled={index === 0}
                      className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-lg text-white disabled:opacity-30 transition-colors"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full self-center">
                      {index + 1}
                    </span>
                    <button 
                      onClick={() => moveRight(index)}
                      disabled={index === images.length - 1}
                      className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-lg text-white disabled:opacity-30 transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="py-8 bg-surface-50 rounded-xl border border-surface-200 text-center">
          <ImageIcon size={32} className="mx-auto text-surface-300 mb-2" />
          <p className="text-sm text-text-muted">Nenhuma imagem adicionada ao carrossel.</p>
        </div>
      )}
    </div>
  );
}
