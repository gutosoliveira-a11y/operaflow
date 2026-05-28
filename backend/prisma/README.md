# Prisma — Setup do Banco de Dados

## Configuração inicial (necessário antes de rodar a migration)

1. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```

2. Abra `.env` e preencha `DATABASE_URL` com sua connection string do Supabase:
   - Acesse: Supabase Dashboard → Settings → Database → Connection string → URI
   - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

3. Execute a migration inicial:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Execute o seed com dados iniciais:
   ```bash
   npm run seed
   ```

## Usuário admin padrão (criado pelo seed)
- Email: `admin@operaflow.com`
- Senha: `admin123`
- **Altere a senha após o primeiro login em produção!**
