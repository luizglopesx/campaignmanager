import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar usuário admin padrão
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@senhorcolchao.com' },
    update: {},
    create: {
      email: 'admin@senhorcolchao.com',
      passwordHash,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin criado: ${admin.email}`);

  // Criar configurações padrão
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        workingHoursStart: '08:00',
        workingHoursEnd: '18:00',
        workingDays: [1, 2, 3, 4, 5],
        defaultFollowUpIntervalDays: 1,
        maxFollowUpAttempts: 5,
      },
    });
    console.log('✅ Settings padrão criadas');
  }

  // Criar templates de exemplo
  const templateCount = await prisma.messageTemplate.count();
  if (templateCount === 0) {
    await prisma.messageTemplate.createMany({
      data: [
        {
          name: 'Follow-up 1 - Primeiro Contato',
          content:
            'Olá {{nome}}, tudo bem? 😊\n\nSou da {{empresa}}! Vi que você demonstrou interesse em nossos produtos.\n\nPosso te ajudar com alguma informação sobre {{produto}}?',
          variables: ['nome', 'empresa', 'produto'],
          type: 'FOLLOW_UP',
          createdBy: admin.id,
        },
        {
          name: 'Follow-up 2 - Acompanhamento',
          content:
            'Oi {{nome}}! 👋\n\nSou o(a) {{vendedor}} da {{empresa}}. Estou entrando em contato novamente sobre nossos produtos.\n\nTemos ótimas condições especiais essa semana! Quer saber mais?',
          variables: ['nome', 'vendedor', 'empresa'],
          type: 'FOLLOW_UP',
          createdBy: admin.id,
        },
        {
          name: 'Campanha - Promoção',
          content:
            '🎉 *PROMOÇÃO ESPECIAL {{empresa}}* 🎉\n\n{{nome}}, preparamos uma oferta imperdível pra você!\n\nConfira as condições especiais que separamos. 👇',
          variables: ['nome', 'empresa'],
          type: 'CAMPAIGN',
          createdBy: admin.id,
        },
      ],
    });
    console.log('✅ Templates de exemplo criados');
  }

  console.log('\n✨ Seed concluído com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
