#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Running seed (idempotent)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seed() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash('admin123', 12);
    await prisma.user.upsert({
      where: { email: 'admin@senhorcolchao.com' },
      update: {},
      create: {
        email: 'admin@senhorcolchao.com',
        passwordHash: hash,
        name: 'Administrador',
        role: 'ADMIN'
      }
    });

    const c = await prisma.settings.count();
    if (c === 0) {
      await prisma.settings.create({
        data: {
          workingHoursStart: '08:00',
          workingHoursEnd: '18:00',
          workingDays: [1,2,3,4,5],
          defaultFollowUpIntervalDays: 1,
          maxFollowUpAttempts: 5
        }
      });
    }

    const t = await prisma.messageTemplate.count();
    if (t === 0) {
      const admin = await prisma.user.findUnique({ where: { email: 'admin@senhorcolchao.com' } });
      await prisma.messageTemplate.createMany({
        data: [
          { name: 'Follow-up 1 - Primeiro Contato', content: 'Olá {{nome}}, tudo bem? Sou da {{empresa}}! Vi que você demonstrou interesse em nossos produtos. Posso te ajudar com alguma informação sobre {{produto}}?', variables: ['nome', 'empresa', 'produto'], type: 'FOLLOW_UP', createdBy: admin.id },
          { name: 'Follow-up 2 - Acompanhamento', content: 'Oi {{nome}}! Sou o(a) {{vendedor}} da {{empresa}}. Estou entrando em contato novamente sobre nossos produtos. Temos ótimas condições especiais essa semana! Quer saber mais?', variables: ['nome', 'vendedor', 'empresa'], type: 'FOLLOW_UP', createdBy: admin.id },
          { name: 'Campanha - Promoção', content: 'PROMOÇÃO ESPECIAL {{empresa}} - {{nome}}, preparamos uma oferta imperdível pra você! Confira as condições especiais que separamos.', variables: ['nome', 'empresa'], type: 'CAMPAIGN', createdBy: admin.id }
        ]
      });
    }

    console.log('✅ Seed complete');
  } finally {
    await prisma.\$disconnect();
  }
}

seed().catch(e => { console.error('Seed error:', e); process.exit(1); });
"

echo "🚀 Starting server..."
exec node dist/server.js
