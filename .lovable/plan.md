
# Plano: Cadastro Manual de Membros e Acesso por Hierarquia

## Resumo

Implementar duas funcionalidades principais:
1. **Cadastro manual de membros da equipe** - Admin pode criar conta de usuario diretamente (email + senha) sem necessidade de convite
2. **Limitacoes por hierarquia** - Barbeiros terao acesso restrito a funcionalidades especificas baseado no cargo

---

## Analise do Estado Atual

### O que ja existe:
- Sistema de roles via tabela `user_roles` com enum `app_role` ('admin' | 'barber')
- Funcao `is_admin()` no banco para verificar permissoes
- `ProtectedRoute` com prop `adminOnly` ja implementada mas nao utilizada
- Sidebar ja oculta secoes para barbeiros (Financeiro, Marketing, Sistema)
- Rotas nao estao protegidas a nivel de codigo (barbeiro pode acessar `/configuracoes` via URL)

### O que falta:
- Opcao de cadastro manual (apenas convite existe hoje)
- Protecao de rotas com `adminOnly`
- Filtragem de dados por barbeiro em paginas de acesso misto

---

## Parte 1: Cadastro Manual de Membros

### 1.1 Edge Function `create-team-member`

Criar uma Edge Function que utiliza a service role key para criar usuarios:

**Arquivo:** `supabase/functions/create-team-member/index.ts`

A funcao vai:
1. Validar JWT do chamador
2. Verificar se o chamador e admin da organizacao (via query no `user_roles`)
3. Criar usuario via `supabase.auth.admin.createUser()`
4. Criar registro em `profiles` com `organization_id` do admin
5. Criar registro em `user_roles` com role escolhida
6. Criar registros padrao em `working_hours` (7 dias)
7. Retornar sucesso ou erro

**Parametros aceitos:**
- `email` (obrigatorio)
- `password` (obrigatorio, min 6 caracteres)
- `full_name` (obrigatorio)
- `phone` (opcional)
- `role` (admin | barber, padrao: barber)
- `commission_percentage` (padrao: 50)
- `product_commission_percentage` (padrao: 10)

### 1.2 Configuracao da Edge Function

**Arquivo:** `supabase/config.toml`

Adicionar configuracao para desabilitar JWT verification (validacao sera feita manualmente):

```text
[functions.create-team-member]
verify_jwt = false
```

### 1.3 Componente CreateMemberDialog

**Arquivo:** `src/components/equipe/CreateMemberDialog.tsx`

Modal com formulario:
- Email (obrigatorio)
- Senha temporaria (obrigatorio, min 6 caracteres)
- Nome completo (obrigatorio)
- Telefone (opcional)
- Cargo: Admin ou Barbeiro (radio buttons)
- Comissao de servicos (%, padrao 50)
- Comissao de produtos (%, padrao 10)

### 1.4 Atualizacao da Pagina Equipe

**Arquivo:** `src/pages/Equipe.tsx`

Modificacoes:
- Adicionar segundo botao "Cadastrar Membro" ao lado de "Convidar Membro"
- Integrar o novo `CreateMemberDialog`
- Chamar a Edge Function ao submeter o formulario

---

## Parte 2: Limitacoes por Hierarquia

### 2.1 Protecao de Rotas Admin-Only

**Arquivo:** `src/App.tsx`

Aplicar `adminOnly` nas rotas que devem ser exclusivas para administradores:

```text
Rotas a proteger com adminOnly:
- /despesas (Despesas)
- /relatorios (Relatorios)
- /descontos (Descontos)
- /fidelidade (Fidelidade)
- /notificacoes (Notificacoes)
- /avaliacoes (Avaliacoes)
- /configuracoes (Configuracoes)
- /integracoes (Integracoes)
```

Rotas que permanecem abertas mas com dados filtrados:
- /dashboard
- /agenda
- /clientes
- /servicos
- /equipe
- /produtos
- /vendas
- /caixa
- /comissoes

### 2.2 Matriz de Permissoes

| Funcionalidade | Admin | Barbeiro |
|---------------|-------|----------|
| Dashboard | Completo | Apenas suas comissoes |
| Agenda | Todos barbeiros | Ver todos, editar apenas seus |
| Clientes | CRUD completo | Somente leitura |
| Servicos | CRUD completo | Somente leitura |
| Equipe | Gerenciar membros | Ver apenas seu perfil |
| Produtos | CRUD + estoque | Somente leitura |
| Vendas (PDV) | Todas vendas | Registrar e ver proprias |
| Caixa | Abrir/fechar/sangria | Apenas visualizar status |
| Comissoes | Ver/pagar todas | Ver apenas proprias (ja implementado) |
| Despesas | CRUD completo | Bloqueado (rota protegida) |
| Relatorios | Todos | Bloqueado |
| Descontos | CRUD completo | Bloqueado |
| Fidelidade | Configurar | Bloqueado |
| Notificacoes | Configurar | Bloqueado |
| Avaliacoes | Ver todas | Bloqueado |
| Configuracoes | Completo | Bloqueado |
| Integracoes | Configurar | Bloqueado |

### 2.3 Ajustes nas Paginas de Acesso Misto

**Paginas a modificar:**

1. **src/pages/Clientes.tsx**
   - Barbeiro: esconder botoes Adicionar, Editar, Excluir
   - Manter busca e visualizacao

2. **src/pages/Servicos.tsx**
   - Barbeiro: esconder botoes Adicionar, Editar, toggle ativo/inativo
   - Manter visualizacao da lista

3. **src/pages/Produtos.tsx**
   - Barbeiro: esconder CRUD e controle de estoque
   - Manter visualizacao para saber o que vender no PDV

4. **src/pages/Caixa.tsx**
   - Barbeiro: esconder acoes (abrir, fechar, sangria, reforco)
   - Mostrar apenas status atual do caixa

5. **src/pages/Equipe.tsx**
   - Barbeiro: ver apenas seu proprio card
   - Esconder botao de convite/cadastro

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/create-team-member/index.ts` | Edge Function para criar usuarios |
| `src/components/equipe/CreateMemberDialog.tsx` | Modal de cadastro manual |

## Arquivos a Modificar

| Arquivo | Modificacoes |
|---------|-------------|
| `supabase/config.toml` | Adicionar config da Edge Function |
| `src/pages/Equipe.tsx` | Botao e integracao do cadastro manual |
| `src/App.tsx` | Adicionar `adminOnly` nas rotas protegidas |
| `src/pages/Clientes.tsx` | Esconder CRUD para barbeiros |
| `src/pages/Servicos.tsx` | Esconder CRUD para barbeiros |
| `src/pages/Produtos.tsx` | Esconder CRUD para barbeiros |
| `src/pages/Caixa.tsx` | Esconder acoes para barbeiros |

---

## Detalhes Tecnicos

### Edge Function create-team-member

```text
Endpoint: POST /functions/v1/create-team-member
Authorization: Bearer <user_jwt>
Content-Type: application/json

Body:
{
  "email": "barbeiro@email.com",
  "password": "senha123",
  "full_name": "Nome do Barbeiro",
  "phone": "(11) 99999-9999",
  "role": "barber",
  "commission_percentage": 50,
  "product_commission_percentage": 10
}

Response (sucesso):
{ "success": true, "user_id": "uuid" }

Response (erro):
{ "error": "not_authorized" }
```

### Seguranca

1. A Edge Function valida o JWT do chamador
2. Verifica se o chamador tem role 'admin' na mesma organizacao
3. Usa `supabase.auth.admin.createUser()` com `email_confirm: true`
4. O novo usuario recebe email de confirmacao
5. Senha pode ser alterada pelo usuario apos primeiro login

---

## Ordem de Implementacao

1. **Edge Function** - Criar `create-team-member`
2. **config.toml** - Adicionar configuracao da funcao
3. **CreateMemberDialog** - Componente de cadastro
4. **Equipe.tsx** - Integrar novo dialog
5. **App.tsx** - Proteger rotas com `adminOnly`
6. **Paginas mistas** - Ajustar UI baseado em `isAdmin`

---

## Notas Importantes

- O SUPABASE_SERVICE_ROLE_KEY sera necessario na Edge Function (ja disponivel como variavel de ambiente padrao)
- Nao e necessaria migracao SQL - todas as tabelas ja existem
- A protecao de rotas no frontend e complementada pelas RLS policies no banco
- Barbeiros ja tem acesso restrito via RLS em varias tabelas (appointments, expenses, etc.)
