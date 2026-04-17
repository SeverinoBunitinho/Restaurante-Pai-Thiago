# Pai Thiago

Sistema de restaurante em `Next.js + JavaScript + CSS`, com login obrigatorio, cadastro de clientes, areas separadas por papel e banco Supabase.

## O que o projeto entrega

- Login obrigatorio antes de entrar no sistema
- Cadastro publico apenas para clientes
- Funcionarios separados por papel: `waiter`, `manager` e `owner`
- Areas protegidas para cliente e equipe
- Reservas salvas com `server actions`
- Cardapio e estrutura operacional integrados ao Supabase
- Atualizacao em tempo real sem refresh manual nas areas principais
- Recuperacao de senha com fluxo de e-mail e redefinicao dedicada
- Configuracao interna da casa para contato, horarios e delivery
- Painel de prontidao de producao para gerente e dono
- `health`, `readiness`, `robots`, `sitemap` e `manifest` prontos para publicacao
- Schema com `profiles`, `staff_directory`, `menu`, `tables`, `reservations`, `restaurant_settings` e `delivery_zones`

## Rodar localmente

```bash
cd pai-thigo
npm install
npm run dev
```

Abra [http://localhost:3000/login](http://localhost:3000/login).

## Variaveis de ambiente

Crie um arquivo `.env.local` com este conteudo:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=...
PAYMENT_PROVIDER=manual
```

Se quiser cobranca online no futuro, o projeto ja reconhece estes modos:

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

ou:

```env
PAYMENT_PROVIDER=mercadopago
MERCADO_PAGO_ACCESS_TOKEN=...
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=...
```

Sem essas credenciais, o checkout continua funcionando em modo manual, com pagamento no atendimento, retirada ou entrega.

## Configurar o Supabase

1. Crie um projeto no Supabase.
2. Copie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para `.env.local`.
3. No SQL Editor do Supabase, rode [`supabase/schema.sql`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/supabase/schema.sql).
4. No painel `Authentication > Users`, crie manualmente os usuarios internos:
  - `garcom@paithiago.com.br`
  - `gerente@paithiago.com.br`
  - `dono@paithiago.com.br`
5. Defina uma senha para cada conta interna.
6. Clientes podem se cadastrar normalmente em `/cadastro`.

O schema ja semeia a tabela `staff_directory`, entao qualquer usuario criado com esses e-mails entra automaticamente com o papel correto.

Importante: se o schema ja tinha sido rodado antes, execute novamente a versao atual para incluir as tabelas na publicacao `supabase_realtime`. Isso e o que permite atualizacao imediata entre cliente e equipe sem precisar atualizar a pagina.
Tambem e importante definir `NEXT_PUBLIC_SITE_URL` para que os links de confirmacao e recuperacao de senha voltem para o dominio certo do site.

## Criar funcionarios com senha 123123

Se voce quiser automatizar a criacao da equipe com senha `123123`, adicione tambem a chave `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` e rode:

```bash
npm run staff:seed
```

Esse comando cria ou atualiza:

- `garcom@paithiago.com.br`
- `gerente@paithiago.com.br`
- `dono@paithiago.com.br`

Todos com senha `123123`.

## Restaurar cardapio completo e depoimentos

Se o projeto do Supabase resetar e voce perder os itens cadastrados, rode:

```bash
npm run restore:data
```

Esse comando recompõe categorias, pratos, bebidas com tamanhos e depoimentos da casa.

## Restaurar historico antigo do backup

Se quiser recuperar perfis de clientes e pedidos antigos (exportados antes do reset), rode:

```bash
npm run restore:history
```

Por padrao, o comando usa o backup em:

`../backups/pai-thiago-tecnico-2026-03-21_14-40-58/supabase-export`

Se seu backup estiver em outro local:

```bash
node scripts/restore-history-from-backup.mjs --backup-dir "CAMINHO\\supabase-export"
```

## Fluxo de acesso

- `/login`
  - Cliente entra com email e senha
  - Funcionario entra com conta interna pre-criada
- `/cadastro`
  - Somente cliente pode criar conta
- `/recuperar-senha`
  - Solicita o link de redefinicao de senha
- `/redefinir-senha`
  - Conclui a troca da senha a partir do link enviado por e-mail
- `/`
  - Portal inicial autenticado
- `/area-cliente`
  - Perfil do cliente, historico e atalhos
- `/area-funcionario`
  - Painel separado por cargo
- `/painel`
  - Visao operacional da equipe
- `/reservas`
  - Cliente faz reserva propria
  - Equipe registra reserva por atendimento
- `/operacao/configuracoes`
  - Gerente e dono ajustam dados da casa, horarios e cobertura do delivery
  - Tambem acompanham a prontidao de producao do sistema

## Rotas tecnicas de producao

- `/api/health`
  - responde se a aplicacao esta no ar
- `/api/readiness`
  - mostra se o ambiente esta pronto para publicacao
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`

## Conferencia final antes de publicar

1. Rodar `npm run check`
2. Rodar o schema mais recente em [`supabase/schema.sql`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/supabase/schema.sql)
3. Confirmar `NEXT_PUBLIC_SITE_URL` com o dominio real
4. Revisar SMTP em `Supabase Auth`
5. Se quiser cobranca online, adicionar credenciais do gateway escolhido

## Estrutura importante

- [`src/app/login/page.jsx`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/src/app/login/page.jsx)
- [`src/app/cadastro/page.jsx`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/src/app/cadastro/page.jsx)
- [`src/app/area-cliente/page.jsx`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/src/app/area-cliente/page.jsx)
- [`src/app/area-funcionario/page.jsx`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/src/app/area-funcionario/page.jsx)
- [`src/lib/auth.js`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/src/lib/auth.js)
- [`src/lib/site-data.js`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/src/lib/site-data.js)
- [`supabase/schema.sql`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/supabase/schema.sql)
