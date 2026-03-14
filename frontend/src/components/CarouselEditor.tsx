import { useState } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, Type, MousePointerClick, GripVertical } from 'lucide-react';

export interface CardButton {
  buttonId: string;
  buttonText: string;
}

export interface CarouselCard {
  id?: string;
  header: string;
  caption: string;
  buttons: CardButton[];
  order: number;
  imageUrl?: string | null;
}

// Backwards compat alias
export type CarouselImage = CarouselCard;

interface CarouselEditorProps {
  cards: CarouselCard[];
  onChange: (cards: CarouselCard[]) => void;
  disabled?: boolean;
}

export default function CarouselEditor({ cards, onChange, disabled }: CarouselEditorProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const addCard = () => {
    const newCards = [...cards, {
      header: '',
      caption: '',
      buttons: [{ buttonId: `btn_${Date.now()}`, buttonText: '' }],
      order: cards.length,
    }];
    onChange(newCards);
    setExpandedCard(newCards.length - 1);
  };

  const removeCard = (index: number) => {
    const newCards = [...cards];
    newCards.splice(index, 1);
    newCards.forEach((c, i) => { c.order = i; });
    onChange(newCards);
    if (expandedCard === index) setExpandedCard(null);
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const newCards = [...cards];
    [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
    newCards.forEach((c, i) => { c.order = i; });
    onChange(newCards);
    setExpandedCard(index - 1);
  };

  const moveRight = (index: number) => {
    if (index === cards.length - 1) return;
    const newCards = [...cards];
    [newCards[index + 1], newCards[index]] = [newCards[index], newCards[index + 1]];
    newCards.forEach((c, i) => { c.order = i; });
    onChange(newCards);
    setExpandedCard(index + 1);
  };

  const updateCard = (index: number, field: keyof CarouselCard, value: any) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    onChange(newCards);
  };

  const addButton = (cardIndex: number) => {
    const card = cards[cardIndex];
    if ((card.buttons || []).length >= 3) return;
    const newButtons = [...(card.buttons || []), { buttonId: `btn_${Date.now()}`, buttonText: '' }];
    updateCard(cardIndex, 'buttons', newButtons);
  };

  const removeButton = (cardIndex: number, btnIndex: number) => {
    const newButtons = [...(cards[cardIndex].buttons || [])];
    newButtons.splice(btnIndex, 1);
    updateCard(cardIndex, 'buttons', newButtons);
  };

  const updateButton = (cardIndex: number, btnIndex: number, field: keyof CardButton, value: string) => {
    const newButtons = [...(cards[cardIndex].buttons || [])];
    newButtons[btnIndex] = { ...newButtons[btnIndex], [field]: value };
    updateCard(cardIndex, 'buttons', newButtons);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
    backgroundColor: disabled ? '#F9FAFB' : '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Info sobre compatibilidade */}
      <div
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#92400E',
          lineHeight: 1.5,
        }}
      >
        Carrossel requer <strong>minimo 2 cards</strong> e maximo 10. Funciona em Android e WhatsApp Web. iOS mostra aviso de conteudo nao suportado.
      </div>

      {/* Cards horizontais */}
      {cards.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '8px',
            paddingTop: '4px',
            scrollBehavior: 'smooth',
          }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => setExpandedCard(expandedCard === index ? null : index)}
              style={{
                minWidth: expandedCard === index ? '320px' : '240px',
                maxWidth: expandedCard === index ? '320px' : '240px',
                backgroundColor: '#fff',
                border: expandedCard === index ? '2px solid #21808D' : '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: expandedCard === index
                  ? '0 4px 12px rgba(33,128,141,0.15)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* Card Header Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: '#F8FFFE',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    backgroundColor: 'rgba(33,128,141,0.1)',
                    color: '#21808D',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '10px',
                  }}>
                    {index + 1}
                  </span>
                  <GripVertical size={14} style={{ color: '#B0B0B0' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#13343B' }}>
                    {card.header || `Card ${index + 1}`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  {cards.length > 1 && (
                    <>
                      <button
                        onClick={() => moveLeft(index)}
                        disabled={disabled || index === 0}
                        style={{
                          padding: '3px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.3 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#374151',
                        }}
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        onClick={() => moveRight(index)}
                        disabled={disabled || index === cards.length - 1}
                        style={{
                          padding: '3px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          cursor: index === cards.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === cards.length - 1 ? 0.3 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#374151',
                        }}
                      >
                        <ArrowRight size={12} />
                      </button>
                    </>
                  )}
                  {!disabled && (
                    <button
                      onClick={() => removeCard(index)}
                      style={{
                        padding: '3px 6px',
                        backgroundColor: '#FEE2E2',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#EF4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                {/* Header / Titulo */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Type size={12} style={{ color: '#9CA3AF' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Titulo do Card
                    </span>
                  </div>
                  <input
                    type="text"
                    value={card.header || ''}
                    onChange={e => updateCard(index, 'header', e.target.value)}
                    disabled={disabled}
                    placeholder="Ex: Colchao Ortopedico..."
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#21808D'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Body / Texto */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Type size={12} style={{ color: '#9CA3AF' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Texto do Card
                    </span>
                  </div>
                  <textarea
                    value={card.caption || ''}
                    onChange={e => updateCard(index, 'caption', e.target.value)}
                    disabled={disabled}
                    placeholder={`Descricao, preco, detalhes...\nEx: A partir de R$ 999,90`}
                    rows={expandedCard === index ? 4 : 2}
                    style={{
                      ...inputStyle,
                      resize: 'none',
                      lineHeight: 1.4,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#21808D'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                  <p style={{ fontSize: '11px', color: '#B0B0B0', margin: '3px 0 0', lineHeight: 1.3 }}>
                    Use {'{{nome}}'} para personalizar. Use \\n para quebra de linha.
                  </p>
                </div>

                {/* Buttons */}
                {expandedCard === index && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <MousePointerClick size={12} style={{ color: '#9CA3AF' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Botoes (max 3)
                      </span>
                    </div>
                    {(card.buttons || []).map((btn, btnIndex) => (
                      <div key={btnIndex} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={btn.buttonText}
                          onChange={e => updateButton(index, btnIndex, 'buttonText', e.target.value)}
                          disabled={disabled}
                          placeholder="Texto do botao..."
                          style={{ ...inputStyle, flex: 1 }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#21808D'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                        />
                        <input
                          type="text"
                          value={btn.buttonId}
                          onChange={e => updateButton(index, btnIndex, 'buttonId', e.target.value)}
                          disabled={disabled}
                          placeholder="ID..."
                          style={{ ...inputStyle, width: '80px', flex: 'none', fontSize: '11px' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#21808D'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                        />
                        {!disabled && (
                          <button
                            onClick={() => removeButton(index, btnIndex)}
                            style={{
                              padding: '4px',
                              backgroundColor: '#FEE2E2',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#EF4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {!disabled && (card.buttons || []).length < 3 && (
                      <button
                        onClick={() => addButton(index)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          backgroundColor: '#F0FDFA',
                          border: '1px dashed #21808D',
                          borderRadius: '6px',
                          color: '#21808D',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={12} /> Adicionar botao
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation warning */}
      {cards.length === 1 && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#DC2626',
            fontWeight: 500,
          }}
        >
          Adicione pelo menos mais 1 card. O carrossel requer minimo de 2 cards.
        </div>
      )}

      {/* Empty state */}
      {cards.length === 0 && (
        <div
          style={{
            padding: '40px 16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            textAlign: 'center',
          }}
        >
          <MousePointerClick size={32} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 12px' }}>Nenhum card adicionado ao carrossel.</p>
          {!disabled && (
            <button
              onClick={addCard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#21808D',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <Plus size={16} /> Criar primeiro card
            </button>
          )}
        </div>
      )}

      {/* Add card button (when cards exist) */}
      {cards.length > 0 && cards.length < 10 && !disabled && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={addCard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#F0FDFA',
              border: '1px dashed #21808D',
              borderRadius: '8px',
              color: '#21808D',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Plus size={16} /> Adicionar card ({cards.length}/10)
          </button>
        </div>
      )}
    </div>
  );
}
