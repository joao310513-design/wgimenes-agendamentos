import { HORARIOS_SEMANA, HORARIOS_SABADO, WA_NUMBER, type Agendamento, type EntregaSubmitida } from "./constants";

export const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
export const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
export const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const getDiaSemana = (dateStr: string) =>
  dateStr ? new Date(dateStr + "T12:00:00").getDay() : -1;

export const getHorariosForDate = (dateStr: string) => {
  const dia = getDiaSemana(dateStr);
  if (dia === 0) return [];
  if (dia === 6) return HORARIOS_SABADO;
  return HORARIOS_SEMANA;
};

export const gerarChavePix = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [8, 4, 4, 4, 12]
    .map((n) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    )
    .join("-");
};

export function gerarWA(ag: Agendamento) {
  const msg = encodeURIComponent(
    `Olá! Confirmo meu agendamento na WGimenes Cosméticos e Perfumes.\n\n📋 *Serviço:* ${ag.servico}\n📅 *Data:* ${ag.data}\n🕐 *Horário:* ${ag.horario}\n👤 *Nome:* ${ag.nome}`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

export function gerarWAEntrega(en: EntregaSubmitida) {
  const msg = encodeURIComponent(
    `Olá! Gostaria de solicitar uma entrega da WGimenes.\n\n👤 *Nome:* ${en.nome}\n📍 *Endereço:* ${en.endereco}\n🏙️ *Cidade:* ${en.cidade}\n💰 *Taxa:* R$ ${en.taxa.toFixed(2)}\n🔑 *Chave Pix:* ${en.pix}`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}
