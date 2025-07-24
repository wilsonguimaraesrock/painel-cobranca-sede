-- Adicionar coluna data_pagamento na tabela students se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'data_pagamento'
    ) THEN
        ALTER TABLE public.students ADD COLUMN data_pagamento TEXT;
        RAISE NOTICE 'Coluna data_pagamento adicionada à tabela students';
    ELSE
        RAISE NOTICE 'Coluna data_pagamento já existe na tabela students';
    END IF;
END $$;