
# Plano de Melhorias e Finalização do BarberPro Prime

## Resumo Executivo

Após análise completa do projeto, identifiquei melhorias necessárias para edição de comissões, configurações avançadas e funcionalidades faltantes para completar o sistema.

---

## 1. Edição de Comissão Individual por Membro da Equipe

### Situação Atual
- A página Equipe.tsx permite editar `commission_percentage` (comissão de serviços)
- O banco de dados já possui o campo `product_commission_percentage` para comissão de produtos
- A edição atual não inclui a comissão de produtos

### Melhorias Propostas

**1.1 Expandir Modal de Edição em Equipe.tsx**
- Adicionar campo para `product_commission_percentage`
- Separar visualmente "Comissão de Serviços" e "Comissão de Produtos"
- Adicionar tooltips explicativos sobre cada tipo de comissão

**1.2 Criar Seção de Comissões Individuais em Comissoes.tsx**
- Adicionar aba "Configurar Comissões" na página de Comissões
- Permitir visualizar e editar comissões de todos os membros em uma tabela única
- Validar valores entre 0% e 100%

---

## 2. Melhorias na Página de Configurações

### Situação Atual
- Configuracoes.tsx é muito básico - apenas dados da organização (nome, endereço, horários)
- Faltam várias configurações importantes

### Melhorias Propostas

**2.1 Reestruturar com Tabs/Seções**

```text
Configurações
├── Dados da Barbearia (existente)
├── Dias de Funcionamento (NOVO)
├── Comissões Padrão (NOVO)
├── Notificações (NOVO)
└── Link de Agendamento (NOVO)
```

**2.2 Novas Funcionalidades**

- **Dias de Funcionamento**: Edição visual dos dias úteis (`working_days` no banco)
- **Comissões Padrão**: Definir porcentagens padrão para novos membros
- **Link de Agendamento Público**: Exibir e copiar URL `agendar/:slug`
- **Configurações de Notificação**: Ativar/desativar tipos de notificações WhatsApp

---

## 3. Funcionalidades Faltantes Identificadas

### 3.1 Horários de Trabalho Individuais (Working Hours)
- **Situação**: Tabela `working_hours` existe, mas NÃO há interface para editar
- **Impacto**: Cada barbeiro deveria poder ter horários diferentes
- **Solução**: Adicionar modal de "Horários de Trabalho" no card do membro em Equipe.tsx

### 3.2 Link de Convite - URL Incorreta
- **Situação**: Em Equipe.tsx, o link gerado usa `/invite/${token}`
- **Problema**: A rota real é `/convite/:token` conforme App.tsx
- **Solução**: Corrigir para `${window.location.origin}/convite/${data.token}`

### 3.3 Avaliações - Página Pública
- **Situação**: Existe AvaliacaoPublica.tsx mas precisa verificar se está funcional
- **Verificar**: Rota `/avaliacao/:token` precisa existir em App.tsx

---

## 4. Ajustes no Dashboard

### Situação Atual
O Dashboard está funcional mas pode ser melhorado:

### Melhorias Propostas

**4.1 Adicionar Métricas de Comissão**
- Mostrar total de comissões pendentes do mês (para admin)
- Mostrar comissões do barbeiro logado (para não-admin)

**4.2 Alertas Visuais**
- Convites pendentes de aceitação
- Produtos com estoque baixo (já existe)
- Despesas vencidas

**4.3 Quick Actions**
- Botão rápido "Sangria/Reforço" quando caixa está aberto
- Botão "Registrar Venda" direto no dashboard

---

## 5. Resumo das Tarefas de Implementação

### Prioridade Alta (Funcionalidade Core)

| # | Tarefa | Arquivo(s) |
|---|--------|------------|
| 1 | Adicionar campo product_commission_percentage na edição de membro | Equipe.tsx |
| 2 | Corrigir URL do link de convite (/invite -> /convite) | Equipe.tsx |
| 3 | Adicionar rota /avaliacao/:token | App.tsx |
| 4 | Criar interface para edição de Working Hours | Equipe.tsx (novo dialog) |

### Prioridade Média (Configurações)

| # | Tarefa | Arquivo(s) |
|---|--------|------------|
| 5 | Expandir Configuracoes.tsx com tabs | Configuracoes.tsx |
| 6 | Adicionar edição de Dias de Funcionamento | Configuracoes.tsx |
| 7 | Adicionar seção Link de Agendamento Público | Configuracoes.tsx |
| 8 | Adicionar aba "Configurar" em Comissoes.tsx | Comissoes.tsx |

### Prioridade Baixa (Dashboard/UX)

| # | Tarefa | Arquivo(s) |
|---|--------|------------|
| 9 | Adicionar métricas de comissão no Dashboard | Dashboard.tsx |
| 10 | Adicionar quick actions no Dashboard | Dashboard.tsx |

---

## Detalhamento Técnico

### Tarefa 1: Edição de Comissão de Produtos

**Modificação em Equipe.tsx:**
```typescript
// Adicionar ao formData
const [formData, setFormData] = useState({
  full_name: '',
  phone: '',
  commission_percentage: '0',
  product_commission_percentage: '0', // NOVO
  is_active: true,
});

// Adicionar campo no modal de edição
<div className="space-y-2">
  <Label>Comissão Serviços (%)</Label>
  <Input type="number" ... />
</div>
<div className="space-y-2">
  <Label>Comissão Produtos (%)</Label>
  <Input type="number" ... />
</div>
```

### Tarefa 2: Correção URL Convite

**Modificação em Equipe.tsx linha 147:**
```typescript
// DE:
const link = `${window.location.origin}/invite/${data.token}`;
// PARA:
const link = `${window.location.origin}/convite/${data.token}`;
```

### Tarefa 3: Adicionar Rota de Avaliação Pública

**Modificação em App.tsx:**
```typescript
// Adicionar após as rotas públicas
import AvaliacaoPublica from "./pages/AvaliacaoPublica";

// Na seção de rotas públicas
<Route path="/avaliacao/:token" element={<AvaliacaoPublica />} />
```

### Tarefa 4: Interface de Working Hours

**Novo componente WorkingHoursDialog:**
- Grid visual com os 7 dias da semana
- Toggle para dia trabalhado ou não
- Time pickers para horário de início/fim de cada dia
- Salvar alterações na tabela `working_hours`

### Tarefa 5-7: Expansão de Configurações

**Nova estrutura de Configuracoes.tsx:**
```typescript
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">Geral</TabsTrigger>
    <TabsTrigger value="schedule">Horários</TabsTrigger>
    <TabsTrigger value="commissions">Comissões</TabsTrigger>
    <TabsTrigger value="booking">Agendamento</TabsTrigger>
  </TabsList>
  
  <TabsContent value="general">
    {/* Formulário atual */}
  </TabsContent>
  
  <TabsContent value="schedule">
    {/* Edição de working_days com checkboxes */}
  </TabsContent>
  
  <TabsContent value="commissions">
    {/* Comissões padrão da organização */}
  </TabsContent>
  
  <TabsContent value="booking">
    {/* Link público + QR Code */}
  </TabsContent>
</Tabs>
```

---

## Arquivos a Serem Modificados

1. **src/pages/Equipe.tsx** - Comissão produtos, working hours dialog, URL convite
2. **src/pages/Configuracoes.tsx** - Expansão com tabs
3. **src/pages/Comissoes.tsx** - Aba de configuração de comissões
4. **src/pages/Dashboard.tsx** - Métricas adicionais
5. **src/App.tsx** - Nova rota /avaliacao/:token

---

## Estimativa de Esforço

| Tarefa | Complexidade | Arquivos |
|--------|--------------|----------|
| Comissão de produtos | Baixa | 1 |
| Correção URL convite | Muito baixa | 1 |
| Rota avaliação | Muito baixa | 1 |
| Working Hours Dialog | Média | 1-2 |
| Expansão Configurações | Média | 1 |
| Aba Configurar Comissões | Baixa | 1 |
| Métricas Dashboard | Baixa | 1 |

**Total: ~7 modificações, sem necessidade de novas tabelas no banco**
