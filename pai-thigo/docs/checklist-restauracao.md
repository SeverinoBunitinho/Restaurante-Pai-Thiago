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
2. Executar o arquivo [`supabase/schema.sql`](/Users/Windows Lite BR/Documents/New project 2/pai-thigo/supabase/schema.sql).
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

## 4) Restaurar cardapio completo e depoimentos

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

## 5) Validacao tecnica

1. Rodar:

```bash
npm run check
```

2. Validar online:
   - `/api/health`
   - `/api/readiness`

## 6) Validacao funcional (manual)

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

## 7) Itens opcionais de producao

1. Configurar SMTP no Supabase Auth (confirmacao e recuperacao de senha).
2. Configurar gateway de pagamento (se quiser checkout online automatico).
