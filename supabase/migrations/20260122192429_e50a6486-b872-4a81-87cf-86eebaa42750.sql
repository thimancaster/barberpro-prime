-- Add recurring expense fields
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none' 
  CHECK (recurrence_type IN ('none', 'monthly', 'weekly', 'yearly'));

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS recurrence_day INTEGER CHECK (recurrence_day >= 1 AND recurrence_day <= 31);

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS parent_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Add index for recurring expenses lookup
CREATE INDEX IF NOT EXISTS idx_expenses_recurrence ON public.expenses(organization_id, recurrence_type) WHERE recurrence_type != 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.recurrence_type IS 'Type of recurrence: none, monthly, weekly, yearly';
COMMENT ON COLUMN public.expenses.recurrence_day IS 'Day of month/week for recurrence';
COMMENT ON COLUMN public.expenses.parent_expense_id IS 'Reference to original recurring expense template';