export const HORARIOS_SEMANA = ["09:00","10:00","11:00","14:00","15:00","16:00","17:00"];
export const HORARIOS_SABADO = ["09:00","10:00","11:00","14:00","15:00"];

export const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export const TAXA_ENTREGA: Record<string, number> = { "Corumbá": 8.00, "Ladário": 12.00 };
export const ADMIN_SENHA = "gimenes0905";
export const WA_NUMBER = "5567981844786";

export const VIEWS = [
  { id: "home", label: "Início" },
  { id: "agendar", label: "Agendar" },
  { id: "lista", label: "Agendamentos" },
  { id: "calendario", label: "Calendário" },
  { id: "entregas", label: "🛵 Entregas" },
  { id: "pix", label: "💳 Pix" },
  { id: "admin", label: "🔒 Gestão" },
] as const;

export type ViewId = typeof VIEWS[number]["id"] | "sucesso" | "entregaSucesso";

export interface Agendamento {
  id: number;
  nome: string;
  telefone: string;
  data: string;
  horario: string;
  status: "pendente" | "confirmado" | "cancelado";
  servico: string;
}

export interface EntregaSubmitida {
  nome: string;
  endereco: string;
  cidade: string;
  pix: string;
  taxa: number;
}
