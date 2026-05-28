const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.ticket.findMany({ where: { source: 'whatsapp' }, orderBy: { createdAt: 'desc' }, take: 3 })
  .then(t => { console.log(JSON.stringify(t, null, 2)); prisma.$disconnect(); })
  .catch(e => { console.error(e.message); prisma.$disconnect(); });
