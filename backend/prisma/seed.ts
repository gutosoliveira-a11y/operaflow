import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@operaflow.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: { name: 'Administrador', email: adminEmail, passwordHash, role: Role.administrador },
    });
    console.log('✓ Admin criado: admin@operaflow.com / admin123');
  } else {
    console.log('Admin já existe, pulando...');
  }

  const setores = [
    { name: 'Manutenção', slaDefaultHours: 4 },
    { name: 'Produção', slaDefaultHours: 2 },
    { name: 'Qualidade', slaDefaultHours: 8 },
    { name: 'PCP', slaDefaultHours: 24 },
    { name: 'Compras', slaDefaultHours: 48 },
    { name: 'Segurança', slaDefaultHours: 1 },
    { name: 'TI', slaDefaultHours: 8 },
  ];

  for (const setor of setores) {
    await prisma.sector.upsert({
      where: { name: setor.name },
      update: {},
      create: setor,
    });
    console.log(`✓ Setor: ${setor.name}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
