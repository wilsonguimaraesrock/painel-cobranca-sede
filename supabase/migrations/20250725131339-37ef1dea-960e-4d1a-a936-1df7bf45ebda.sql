-- Atualizar data_pagamento para alunos que estão em "pagamento-feito" mas não têm data_pagamento
-- Usar a data do status_history quando foram movidos para "pagamento-feito"

UPDATE students 
SET data_pagamento = (
  SELECT TO_CHAR(sh.changed_at, 'YYYY-MM-DD')
  FROM status_history sh 
  WHERE sh.student_id = students.id 
    AND sh.new_status = 'pagamento-feito'
  ORDER BY sh.changed_at DESC 
  LIMIT 1
)
WHERE students.status = 'pagamento-feito' 
  AND (students.data_pagamento IS NULL OR students.data_pagamento = '');

-- Comentário: Esta migração corrige as datas de pagamento dos alunos que já estão
-- marcados como "pagamento-feito" mas não têm a data_pagamento preenchida,
-- usando a data do histórico de mudança de status para "pagamento-feito".