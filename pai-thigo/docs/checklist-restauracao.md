# Checklist de restauracao (Pai Thiago)

Use este guia quando o Supabase resetar ou perder dados.

## 1) Preparar ambiente

1. Confirmar `.env.local` com:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
2. Rodar `npm install` (se necessario).

## 2) Restaurar estrutura do banco

1. Abrir `Supabase > SQL Editor`.
2. Executar `supabase/schema.sql`.
3. Confirmar que nao houve erro bloqueante.

## 3) Restaurar contas internas

1. Rodar:

```bash
npm run staff:seed
```

Isso garante:
- `garcom@paithiago.com.br` (waiter)
- `gerente@paithiago.com.br` (manager)
- `dono@paithiago.com.br` (owner)

## 4) Restaurar cardapio base e depoimentos

1. Rodar:

```bash
npm run restore:data
```

Esse comando recompõe:
- Categorias principais
- Comidas brasileiras
- Bebidas com tamanhos/porcoes
- Depoimentos aprovados
- Estoque e alerta de estoque iniciais

## 5) Restaurar historico antigo do backup

1. Rodar:

```bash
npm run restore:history
```

Esse comando recompõe (sem apagar dados atuais):
- Perfis antigos de clientes
- Pedidos historicos
- Configuracoes da casa
- Zonas de delivery do backup

Se o backup estiver em outro local, use:

```bash
node scripts/restore-history-from-backup.mjs --backup-dir "CAMINHO\\supabase-export"
```

## 6) Validacao tecnica

1. Rodar:

```bash
npm run check
```

2. Validar online:
   - `/api/health`
   - `/api/readiness`

## 7) Validacao funcional (manual)

1. Login cliente.
2. Login funcionario (garcom, gerente, dono).
3. Cliente:
   - Ver cardapio
   - Adicionar no carrinho
   - Finalizar pedido
   - Reservar mesa
4. Equipe:
   - Ver pedido em tempo real
   - Atualizar status
   - Ajustar estoque de item esgotado
   - Conferir reserva recebida

## 8) Itens opcionais de producao

1. Configurar SMTP no Supabase Auth (confirmacao e recuperacao de senha).
2. Configurar gateway de pagamento (se quiser checkout online automatico).
