
-- Agendamentos table
CREATE TABLE public.agendamentos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  servico TEXT NOT NULL DEFAULT 'Visita à Loja',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agendamentos" ON public.agendamentos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agendamentos" ON public.agendamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agendamentos" ON public.agendamentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete agendamentos" ON public.agendamentos FOR DELETE USING (true);

-- Horarios bloqueados table
CREATE TABLE public.horarios_bloqueados (
  id BIGSERIAL PRIMARY KEY,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(data, horario)
);

ALTER TABLE public.horarios_bloqueados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bloqueios" ON public.horarios_bloqueados FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bloqueios" ON public.horarios_bloqueados FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete bloqueios" ON public.horarios_bloqueados FOR DELETE USING (true);

-- Configuracoes table (key-value store)
CREATE TABLE public.configuracoes (
  id BIGSERIAL PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read configuracoes" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert configuracoes" ON public.configuracoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update configuracoes" ON public.configuracoes FOR UPDATE USING (true);

-- Seed default config values
INSERT INTO public.configuracoes (chave, valor) VALUES
  ('pix_chave', ''),
  ('taxa_corumba', '8.00'),
  ('taxa_ladario', '12.00');
