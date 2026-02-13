
# Neo-Vintage Glass - Upgrade Visual do BarberPro Prime

Transformacao completa do design system para elevar a interface de "template shadcn" para um produto SaaS premium, unindo estetica classica de barbearia com Glassmorphism 2.0 e Bento Grid.

---

## Fase 1: Design System Base (CSS + Tailwind)

### 1.1 Novas classes utilitarias no `src/index.css`

Adicionar no `@layer components`:

- **`.glass-panel`** - Card com glassmorphism: `bg-card/40`, `backdrop-blur-xl`, borda `white/5`, sombra interna para efeito de volume liquido, hover com glow dourado e `translateY(-2px)`
- **`.btn-neo`** - Botoes com neumorphism sutil: sombra dupla (luz/escuro), `active:scale-95` para feedback tatil
- **`.btn-gold-glass`** - Variante dourada com backdrop-blur para botoes de acao primaria
- **`.ambient-bg`** - Fundo com radial-gradients dourados sutis (15% e 85% do viewport) para dar profundidade ao glassmorphism

### 1.2 Novas animacoes no `tailwind.config.ts`

- **`float`** - Animacao de flutuacao suave (6s, translateY -5px) para elementos decorativos
- **`gradient-shift`** - Shift de gradiente (3s) para brilho animado em cards destaque
- Atualizar `borderRadius` para cantos mais suaves (xl: 1.5rem, lg: 1rem, md: 0.75rem) no estilo Bento/Claymorphism

---

## Fase 2: Layout Principal

### 2.1 `AppLayout.tsx`
- Adicionar classe `ambient-bg` ao container `main` para ativar o glow de fundo

### 2.2 `AppHeader.tsx`
- Aplicar `glass-panel` no header (ja tem `backdrop-blur-sm`, vamos intensificar)
- Remover borda inferior dura, usar borda sutil `white/5`

### 2.3 `AppSidebar.tsx`
- Aplicar visual glass sutil na sidebar
- Melhorar contraste dos items ativos com glow dourado

---

## Fase 3: Dashboard Bento Grid

### 3.1 Refatorar grid de stats no `Dashboard.tsx`

Transformar a grid uniforme `grid-cols-4` em Bento Grid assimetrica:

```text
+---------------------------+-------------+
|                           |             |
|    FATURAMENTO HOJE       |   MENSAL    |
|    (Hero - 2 cols,        |  (1 col)    |
|     2 rows)               |             |
|                           +-------------+
|                           |  COMISSOES  |
|                           |  (1 col)    |
+---------------------------+-------------+
|        ESTOQUE / CLIENTES (span 2 cols) |
+------------------------------------------+
```

- Card hero "Faturamento Hoje" ocupa `col-span-2 row-span-2` com glow dourado animado e icone maior
- Cards secundarios usam `glass-panel` com hover interativo
- Card de estoque ocupa `col-span-2` na parte inferior
- Icones dentro de circulos com `bg-primary/10` para hierarquia visual

### 3.2 Aplicar `glass-panel` em todos os cards
- Substituir `card-gradient border-border/50` por `glass-panel rounded-xl`
- Adicionar stagger animation nos cards (delay incremental de 100ms via `style`)

### 3.3 Botoes de acao rapida
- Aplicar `btn-neo` nos botoes "Registrar Venda" e "Ver Agenda"
- Aplicar `btn-gold-glass` no botao primario

---

## Fase 4: Cards e Componentes Globais

### 4.1 Proximo Atendimentos
- Aplicar `glass-panel` ao card principal
- Hover com `border-primary/30` nos items de agendamento

### 4.2 Welcome Section
- Adicionar efeito de gradiente no nome do usuario usando `text-gold-gradient`

---

## Arquivos Modificados

| Arquivo | Mudancas |
|---------|---------|
| `src/index.css` | Adicionar classes glass-panel, btn-neo, btn-gold-glass, ambient-bg |
| `tailwind.config.ts` | Adicionar keyframes float e gradient-shift, atualizar borderRadius |
| `src/components/layout/AppLayout.tsx` | Adicionar ambient-bg ao main |
| `src/components/layout/AppHeader.tsx` | Aplicar glass-panel no header |
| `src/pages/Dashboard.tsx` | Refatorar para Bento Grid com glass-panel |

## Nenhum Arquivo Novo

Todas as mudancas sao em arquivos existentes, focadas em CSS e layout.

## Notas Tecnicas

- O glassmorphism funciona melhor sobre o `ambient-bg` porque o blur precisa de algo para distorcer
- As animacoes usam `ease-in-out` para movimento organico
- O `active:scale-95` no btn-neo simula feedback haptico no desktop
- Os border-radius maiores (Claymorphism) dao sensacao mais "premium" e organica
- Nenhuma dependencia nova sera adicionada - tudo usa Tailwind + CSS nativo
