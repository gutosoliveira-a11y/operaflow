import { PrismaClient, Role, TicketStatus, Priority, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_USERS = [
  { email: 'gerente@operaflow.com',     name: 'Carlos Mendes',  role: Role.gerente },
  { email: 'coordenador@operaflow.com', name: 'Ana Lima',       role: Role.coordenador },
  { email: 'supervisor1@operaflow.com', name: 'Roberto Silva',  role: Role.supervisor },
  { email: 'supervisor2@operaflow.com', name: 'Fernanda Costa', role: Role.supervisor },
];

const SLA_MATRIX: Record<string, Record<string, number>> = {
  'Manutenção': { baixa: 24, media: 8,  alta: 4,  critica: 1 },
  'Produção':   { baixa: 24, media: 4,  alta: 2,  critica: 1 },
  'Qualidade':  { baixa: 48, media: 24, alta: 8,  critica: 4 },
  'Segurança':  { baixa: 8,  media: 4,  alta: 1,  critica: 1 },
  'TI':         { baixa: 48, media: 24, alta: 8,  critica: 4 },
  'PCP':        { baixa: 72, media: 48, alta: 24, critica: 8 },
  'Compras':    { baixa: 72, media: 48, alta: 24, critica: 8 },
};

interface TicketSeed {
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  sectorName: string;
  hoursAgo: number;
  overdueBy?: number;
}

const DEMO_TICKETS: TicketSeed[] = [
  // Abertos (10)
  { title: 'Prensa hidráulica L3 — falha de pressão',    description: 'Prensa parou durante ciclo. Pressão zero no manômetro.', status: 'aberto', priority: 'critica', sectorName: 'Manutenção', hoursAgo: 1 },
  { title: 'Falta de EPI setor solda',                    description: 'Luvas e máscaras de solda acabaram no estoque.', status: 'aberto', priority: 'alta', sectorName: 'Segurança', hoursAgo: 3 },
  { title: 'Sistema MES offline',                         description: 'Interface MES não responde. Linha 2 parada.', status: 'aberto', priority: 'critica', sectorName: 'TI', hoursAgo: 0.5 },
  { title: 'Vazamento óleo caixa de redução B7',         description: 'Piso contaminado, risco de acidente.', status: 'aberto', priority: 'alta', sectorName: 'Manutenção', hoursAgo: 2 },
  { title: 'Peça fora de especificação lote #4421',       description: 'Amostra reprovada. Solicitar inspeção completa.', status: 'aberto', priority: 'media', sectorName: 'Qualidade', hoursAgo: 4 },
  { title: 'Falta de matéria-prima — aço carbono 1045',  description: 'Estoque zerou. Produção para em 2h.', status: 'aberto', priority: 'critica', sectorName: 'Compras', hoursAgo: 1.5 },
  { title: 'Rolamento motor bomba #12 com ruído',        description: 'Ruído anormal indicando desgaste. Preventiva urgente.', status: 'aberto', priority: 'media', sectorName: 'Manutenção', hoursAgo: 6 },
  { title: 'Atraso PCP — OP 2024-089 não entregue',      description: 'Ordem de produção atrasada 1 dia. Cliente aguarda.', status: 'aberto', priority: 'alta', sectorName: 'PCP', hoursAgo: 8 },
  { title: 'Temperatura compressor ar acima do limite',  description: 'Sensor indicando 95°C. Limite é 80°C.', status: 'aberto', priority: 'alta', sectorName: 'Manutenção', hoursAgo: 5 },
  { title: 'Impressora etiquetas linha 4 com defeito',   description: 'Saindo etiquetas borradas. Produção em standby.', status: 'aberto', priority: 'baixa', sectorName: 'TI', hoursAgo: 12 },

  // Em andamento (8)
  { title: 'Correia transportadora B2 — troca programada', description: 'Substituição preventiva agendada.', status: 'em_andamento', priority: 'media', sectorName: 'Manutenção', hoursAgo: 10 },
  { title: 'Calibração balança linha 5',                   description: 'Calibração semestral em andamento.', status: 'em_andamento', priority: 'baixa', sectorName: 'Qualidade', hoursAgo: 4 },
  { title: 'Instalação novo servidor backup',              description: 'Migração de dados em progresso.', status: 'em_andamento', priority: 'media', sectorName: 'TI', hoursAgo: 6 },
  { title: 'Inspeção elétrica painéis CLP',                description: 'Equipe elétrica inspecionando todos os painéis.', status: 'em_andamento', priority: 'media', sectorName: 'Manutenção', hoursAgo: 8 },
  { title: 'Negociação fornecedor parafusos M12',          description: 'Contato realizado, aguardando proposta.', status: 'em_andamento', priority: 'baixa', sectorName: 'Compras', hoursAgo: 24 },
  { title: 'Revisão POP linha de montagem',                description: 'Procedimento operacional sendo atualizado.', status: 'em_andamento', priority: 'baixa', sectorName: 'Qualidade', hoursAgo: 16 },
  { title: 'Reparo freio motor esteira L1',                description: 'Desmontagem realizada, peça em análise.', status: 'em_andamento', priority: 'alta', sectorName: 'Manutenção', hoursAgo: 3 },
  { title: 'Treinamento operadores NR-12',                 description: 'Treinamento com 8 operadores em sala.', status: 'em_andamento', priority: 'baixa', sectorName: 'Segurança', hoursAgo: 2 },

  // Aguardando (5)
  { title: 'Aguardando peça — rolamento motor bomba 12',  description: 'Peça solicitada. ETA: 2 dias.', status: 'aguardando', priority: 'media', sectorName: 'Manutenção', hoursAgo: 48 },
  { title: 'Laudo qualidade lote #4421',                   description: 'Enviado para lab externo. Prazo 3 dias úteis.', status: 'aguardando', priority: 'media', sectorName: 'Qualidade', hoursAgo: 72 },
  { title: 'Aprovação orçamento compressor reserva',       description: 'Proposta enviada para aprovação do gerente.', status: 'aguardando', priority: 'alta', sectorName: 'Compras', hoursAgo: 30 },
  { title: 'Resposta fornecedor fluido hidráulico',        description: 'E-mail enviado, aguardando resposta.', status: 'aguardando', priority: 'baixa', sectorName: 'Compras', hoursAgo: 24 },
  { title: 'Revisão técnica CLP linha 2 pelo fabricante', description: 'Técnico externo agendado para amanhã.', status: 'aguardando', priority: 'alta', sectorName: 'TI', hoursAgo: 12 },

  // Escalados (3)
  { title: 'Vazamento óleo compressor central — +4h sem atendimento', description: 'Escalonado após 4h sem resposta. Risco operacional alto.', status: 'escalado', priority: 'critica', sectorName: 'Manutenção', hoursAgo: 6, overdueBy: 4 },
  { title: 'Parada geral linha 2 — escalonamento gerência',            description: 'Linha parada há 5h. Prejuízo estimado R$ 50k.', status: 'escalado', priority: 'critica', sectorName: 'Produção', hoursAgo: 5, overdueBy: 5 },
  { title: 'Acidente de trabalho — relatório atrasado',               description: 'Prazo legal para entrega do relatório venceu.', status: 'escalado', priority: 'critica', sectorName: 'Segurança', hoursAgo: 8, overdueBy: 2 },

  // Finalizados (4)
  { title: 'Troca filtro ar comprimido',              description: 'Manutenção preventiva concluída.', status: 'finalizado', priority: 'baixa', sectorName: 'Manutenção', hoursAgo: 72 },
  { title: 'Atualização firmware CLP linha 3',        description: 'Firmware v3.2.1 instalado com sucesso.', status: 'finalizado', priority: 'media', sectorName: 'TI', hoursAgo: 48 },
  { title: 'Entrega OP 2024-085',                     description: 'Ordem concluída e entregue ao cliente.', status: 'finalizado', priority: 'alta', sectorName: 'PCP', hoursAgo: 96 },
  { title: 'Reposição lubrificante caixa câmbio B1', description: 'Lubrificação realizada conforme cronograma.', status: 'finalizado', priority: 'baixa', sectorName: 'Manutenção', hoursAgo: 120 },
];

async function main() {
  console.log('🌱 Iniciando seed de demonstração...');

  const passwordHash = await bcrypt.hash('demo123', 12);

  // Upsert usuários demo
  const createdUsers: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, passwordHash, isActive: true },
      update: { name: u.name, role: u.role },
    });
    createdUsers[u.email] = user.id;
    console.log(`  ✓ Usuário: ${u.email}`);
  }

  // Buscar setores existentes
  const sectors = await prisma.sector.findMany();
  const sectorMap: Record<string, string> = {};
  for (const s of sectors) sectorMap[s.name] = s.id;
  console.log(`  ✓ ${sectors.length} setores encontrados: ${sectors.map(s => s.name).join(', ')}`);

  // Upsert configs SLA
  let slaCount = 0;
  for (const [sectorName, priorities] of Object.entries(SLA_MATRIX)) {
    const sectorId = sectorMap[sectorName];
    if (!sectorId) {
      console.log(`  ⚠ Setor "${sectorName}" não encontrado, pulando SLA`);
      continue;
    }
    for (const [priority, hours] of Object.entries(priorities)) {
      await prisma.slaConfig.upsert({
        where: { sectorId_priority: { sectorId, priority: priority as Priority } },
        create: { sectorId, priority: priority as Priority, hoursLimit: hours },
        update: { hoursLimit: hours },
      });
      slaCount++;
    }
  }
  console.log(`  ✓ ${slaCount} configurações SLA`);

  // Buscar admin para createdBy
  const admin = await prisma.user.findFirst({ where: { role: Role.administrador } });
  const createdBy = admin?.id ?? Object.values(createdUsers)[0];

  // Responsáveis: supervisores demo
  const supervisorIds = [
    createdUsers['supervisor1@operaflow.com'],
    createdUsers['supervisor2@operaflow.com'],
  ].filter(Boolean);

  // Criar tickets
  let ticketCount = 0;
  const createdTicketIds: string[] = [];

  for (const t of DEMO_TICKETS) {
    const sectorId = sectorMap[t.sectorName];
    if (!sectorId) {
      console.log(`  ⚠ Setor "${t.sectorName}" não encontrado para ticket "${t.title}"`);
      continue;
    }

    const now = new Date();
    const createdAt = new Date(now.getTime() - t.hoursAgo * 3_600_000);
    const slaHours = SLA_MATRIX[t.sectorName]?.[t.priority] ?? 24;
    const slaDueDate = t.overdueBy
      ? new Date(now.getTime() - t.overdueBy * 3_600_000)
      : new Date(createdAt.getTime() + slaHours * 3_600_000);

    const closedAt =
      t.status === 'finalizado'
        ? new Date(createdAt.getTime() + slaHours * 0.8 * 3_600_000)
        : null;

    const ticket = await prisma.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        sectorId,
        responsibleId: supervisorIds[ticketCount % supervisorIds.length] ?? null,
        createdBy,
        source: 'manual',
        slaDueDate,
        escalationLevel: t.status === 'escalado' ? 2 : 0,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 600_000),
        closedAt,
      },
    });

    if (t.status === 'escalado') createdTicketIds.push(ticket.id);
    ticketCount++;
  }
  console.log(`  ✓ ${ticketCount} tickets criados`);

  // 5 notificações não lidas para o admin
  if (admin) {
    const targets = createdTicketIds.slice(0, 5);
    const notifData = targets.map((ticketId, i) => ({
      userId: admin.id,
      title: '🚨 Ticket escalado sem atendimento',
      message: `Chamado #${ticketId.slice(0,8).toUpperCase()} aguarda resolução urgente.`,
      type: i % 2 === 0 ? NotificationType.sla_breach : NotificationType.escalation,
      isRead: false,
    }));

    // Pad to 5 if fewer escalated tickets
    while (notifData.length < 5 && admin) {
      notifData.push({
        userId: admin.id,
        title: '⚠️ Alerta SLA',
        message: 'Verifique os chamados próximos do prazo SLA.',
        type: NotificationType.sla_breach,
        isRead: false,
      });
    }

    await prisma.notification.createMany({ data: notifData.slice(0, 5) });
    console.log(`  ✓ ${notifData.slice(0, 5).length} notificações criadas para admin`);
  }

  console.log('\n✅ Seed de demonstração concluído!');
  console.log('\nCredenciais demo (senha: demo123):');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(15)} ${u.email}`);
  }
  console.log('\nAdmin existente: admin@operaflow.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
