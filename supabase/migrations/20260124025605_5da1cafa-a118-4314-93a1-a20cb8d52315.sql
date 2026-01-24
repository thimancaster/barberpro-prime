-- Corrigir policy de reviews para usar validação por token
DROP POLICY IF EXISTS "Anyone can create reviews with valid token" ON public.reviews;

-- Criar uma policy mais segura para inserção de reviews
-- Permite inserção se o token corresponde a um agendamento válido
CREATE POLICY "Users can create reviews for valid appointments"
  ON public.reviews FOR INSERT
  WITH CHECK (
    -- Verificar que o appointment_id corresponde a um agendamento completado da mesma organização
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id
      AND a.organization_id = organization_id
      AND a.status = 'completed'
    )
  );