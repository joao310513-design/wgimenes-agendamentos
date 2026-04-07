import { useState, useEffect, useCallback } from "react";
import type { Agendamento, ViewId, EntregaSubmitida } from "@/lib/constants";
import { TAXA_ENTREGA, ADMIN_SENHA, VIEWS, MESES, DIAS_SEMANA } from "@/lib/constants";
import {
  getDaysInMonth, getFirstDay, dateKey, getDiaSemana,
  getHorariosForDate, gerarChavePix, gerarWA, gerarWAEntrega,
} from "@/lib/helpers";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

/* ────── Field ────── */
function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}

/* ────── Main Page ────── */
export default function WGimenesApp() {
  const [view, setView] = useState<ViewId>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(() => {
    try { return JSON.parse(localStorage.getItem("wg_agendamentos") || "[]"); } catch { return []; }
  });
  const [bloqueios, setBloqueios] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("wg_bloqueios") || "{}"); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem("wg_agendamentos", JSON.stringify(agendamentos)); }, [agendamentos]);
  useEffect(() => { localStorage.setItem("wg_bloqueios", JSON.stringify(bloqueios)); }, [bloqueios]);

  const [form, setForm] = useState({ nome: "", telefone: "", data: "", horario: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Agendamento | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calSelected, setCalSelected] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("todos");

  const [entregaForm, setEntregaForm] = useState({ nome: "", endereco: "", cidade: "" });
  const [entregaErrors, setEntregaErrors] = useState<Record<string, string>>({});
  const [entregaSubmetida, setEntregaSubmetida] = useState<EntregaSubmitida | null>(null);

  const [pixGerado, setPixGerado] = useState<{ chave: string; cidade: string; taxa: number | null } | null>(null);
  const [pixCidade, setPixCidade] = useState("");
  const [pixCopiado, setPixCopiado] = useState(false);

  const [adminAuth, setAdminAuth] = useState(false);
  const [adminSenha, setAdminSenha] = useState("");
  const [adminErro, setAdminErro] = useState(false);
  const [adminTab, setAdminTab] = useState("bloqueios");
  const [adminData, setAdminData] = useState(todayStr);

  const [cfgPixChave, setCfgPixChave] = useState(() => localStorage.getItem("wg_pix_chave") || "");
  const [cfgTaxaCorumba, setCfgTaxaCorumba] = useState(() => {
    const v = localStorage.getItem("wg_taxa_corumba"); return v ? parseFloat(v) : TAXA_ENTREGA["Corumbá"];
  });
  const [cfgTaxaLadario, setCfgTaxaLadario] = useState(() => {
    const v = localStorage.getItem("wg_taxa_ladario"); return v ? parseFloat(v) : TAXA_ENTREGA["Ladário"];
  });
  const [cfgSalvo, setCfgSalvo] = useState(false);

  const taxasAtuais: Record<string, number> = { "Corumbá": cfgTaxaCorumba, "Ladário": cfgTaxaLadario };

  function salvarConfiguracoes() {
    localStorage.setItem("wg_pix_chave", cfgPixChave);
    localStorage.setItem("wg_taxa_corumba", String(cfgTaxaCorumba));
    localStorage.setItem("wg_taxa_ladario", String(cfgTaxaLadario));
    setCfgSalvo(true);
    setTimeout(() => setCfgSalvo(false), 2500);
  }

  const nav = useCallback((v: ViewId) => { setView(v); setMenuOpen(false); }, []);

  const getHorariosOcupados = (data: string) => {
    const bl = bloqueios[data] || [];
    const ag = agendamentos.filter(a => a.data === data && a.status !== "cancelado").map(a => a.horario);
    return [...new Set([...bl, ...ag])];
  };

  const horariosDisponiveis = getHorariosForDate(form.data);
  const horariosOcupados = getHorariosOcupados(form.data);

  function validateAg() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome";
    if (!form.telefone.trim() || form.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone inválido";
    if (!form.data) e.data = "Selecione uma data";
    else if (getDiaSemana(form.data) === 0) e.data = "Não atendemos aos domingos";
    if (!form.horario) e.horario = "Selecione um horário";
    return e;
  }

  function handleSubmit() {
    const e = validateAg();
    setFormErrors(e);
    if (Object.keys(e).length > 0) return;
    const novo: Agendamento = { ...form, id: Date.now(), status: "pendente", servico: "Visita à Loja" };
    setAgendamentos(prev => [...prev, novo]);
    setSubmitted(novo);
    setForm({ nome: "", telefone: "", data: "", horario: "" });
    setFormErrors({});
    nav("sucesso");
  }

  function validateEntrega() {
    const e: Record<string, string> = {};
    if (!entregaForm.nome.trim()) e.nome = "Informe seu nome";
    if (!entregaForm.endereco.trim()) e.endereco = "Informe o endereço";
    if (!entregaForm.cidade) e.cidade = "Selecione a cidade";
    return e;
  }

  function handleEntregaSubmit() {
    const e = validateEntrega();
    setEntregaErrors(e);
    if (Object.keys(e).length > 0) return;
    const pix = cfgPixChave || gerarChavePix();
    const taxa = taxasAtuais[entregaForm.cidade];
    setEntregaSubmetida({ ...entregaForm, pix, taxa });
    setEntregaForm({ nome: "", endereco: "", cidade: "" });
    setEntregaErrors({});
    nav("entregaSucesso");
  }

  function handleGerarPix() {
    const chave = cfgPixChave || gerarChavePix();
    const taxa = pixCidade ? taxasAtuais[pixCidade] : null;
    setPixGerado({ chave, cidade: pixCidade, taxa });
    setPixCopiado(false);
  }

  function copiarPix(chave: string) {
    if (navigator.clipboard) navigator.clipboard.writeText(chave).catch(() => {});
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2500);
  }

  function handleAdminLogin() {
    if (adminSenha === ADMIN_SENHA) { setAdminAuth(true); setAdminErro(false); }
    else setAdminErro(true);
  }

  function toggleBloqueio(data: string, h: string) {
    setBloqueios(prev => {
      const atual = prev[data] || [];
      const novo = atual.includes(h) ? atual.filter(x => x !== h) : [...atual, h];
      return { ...prev, [data]: novo };
    });
  }

  function alterarStatus(id: number, st: Agendamento["status"]) {
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: st } : a));
  }

  function deletarAg(id: number) {
    if (!window.confirm("Excluir agendamento?")) return;
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  }

  const agsFiltrados = agendamentos.filter(a => filterStatus === "todos" || a.status === filterStatus);
  const agsPorDia: Record<string, Agendamento[]> = {};
  agendamentos.forEach(a => { if (!agsPorDia[a.data]) agsPorDia[a.data] = []; agsPorDia[a.data].push(a); });
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDay(calYear, calMonth);
  const isHome = ["home", "sucesso", "entregaSucesso"].includes(view);

  const adminHorariosDisponiveis = getHorariosForDate(adminData);
  const adminBloqueiosDia = bloqueios[adminData] || [];
  const adminAgsDia = agendamentos.filter(a => a.data === adminData);

  const inputCn = "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm bg-card text-foreground outline-none focus:ring-2 focus:ring-ring font-body transition-colors";
  const inputErrorCn = "border-destructive";
  const pillCn = "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-200 cursor-pointer";
  const pillActive = "bg-primary text-primary-foreground border-primary";
  const pillInactive = "bg-transparent text-muted-foreground border-border hover:border-primary/50";

  return (
    <div className="min-h-screen bg-background text-foreground font-body relative overflow-hidden">
      {/* BG decorativo */}
      <div className="fixed -top-24 -right-24 w-96 h-96 rounded-full bg-primary/8 pointer-events-none" />
      <div className="fixed -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary/6 pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/97 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-[960px] mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => nav("home")}>
            <span className="text-xl text-primary font-display">✦</span>
            <div>
              <div className="text-[17px] font-bold tracking-wider text-foreground font-display leading-none">WGimenes</div>
              <div className="text-[9px] text-muted-foreground tracking-[2.5px] uppercase mt-0.5">Cosméticos & Perfumes</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1.5 items-center">
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => nav(v.id)} className={`${pillCn} ${view === v.id || (v.id === "home" && isHome) ? pillActive : pillInactive}`}>
                {v.label}
              </button>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/98 backdrop-blur-xl px-4 py-3 animate-in slide-in-from-top-2">
            <div className="flex flex-wrap gap-2">
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => nav(v.id)} className={`${pillCn} ${view === v.id || (v.id === "home" && isHome) ? pillActive : pillInactive}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="max-w-[760px] mx-auto px-4 py-7 pb-16 relative z-10">

        {/* ── HOME ── */}
        {view === "home" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="text-center py-10 pb-8">
              <div className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[10px] tracking-[3px] uppercase mb-5 font-semibold">
                ✦ Sistema de Agendamentos & Entregas
              </div>
              <h1 className="text-[clamp(28px,7vw,52px)] font-bold leading-[1.1] mb-3.5 font-display text-foreground">
                Bem-vinda à<br /><span className="text-primary italic">WGimenes</span>
              </h1>
              <p className="text-[15px] text-muted-foreground max-w-[440px] mx-auto mb-7 leading-relaxed">
                Agende sua visita à loja ou solicite a entrega dos seus produtos favoritos em Corumbá e Ladário.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => nav("agendar")} className="bg-primary text-primary-foreground rounded-full px-8 py-3 text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity">
                  Agendar Visita →
                </button>
                <button onClick={() => nav("entregas")} className="bg-transparent text-primary border-2 border-primary rounded-full px-8 py-3 text-sm font-semibold tracking-wide hover:bg-primary/5 transition-colors">
                  🛵 Pedir Entrega
                </button>
              </div>
            </div>
            <div className="flex gap-3.5 justify-center flex-wrap mt-2">
              {[
                { n: agendamentos.length, l: "Agendamentos" },
                { n: agendamentos.filter(a => a.status === "confirmado").length, l: "Confirmados" },
                { n: agendamentos.filter(a => a.status === "pendente").length, l: "Pendentes" },
              ].map((st, i) => (
                <div key={i} className="bg-card/92 rounded-2xl px-6 py-4 text-center shadow-sm border border-border/40">
                  <div className="text-3xl font-bold text-primary font-display">{st.n}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mt-1">{st.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUCESSO AGENDAMENTO ── */}
        {view === "sucesso" && submitted && (
          <div className="animate-in zoom-in-95 duration-400 bg-card/92 rounded-2xl p-7 shadow-md border border-border/40">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
            <h2 className="text-[22px] font-bold text-center mb-1.5 font-display">Agendamento realizado!</h2>
            <p className="text-muted-foreground text-center mb-5 text-sm">Seu agendamento foi registrado com sucesso.</p>
            <div className="bg-primary/5 rounded-xl p-3 px-4 mb-5">
              {([["👤 Nome", submitted.nome], ["📋 Serviço", submitted.servico], ["📅 Data", submitted.data], ["🕐 Horário", submitted.horario]] as const).map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-primary/10 gap-3 last:border-0">
                  <span className="text-muted-foreground font-semibold text-[13px]">{l}</span>
                  <span className="text-[13px]">{v}</span>
                </div>
              ))}
            </div>
            <a href={gerarWA(submitted)} target="_blank" rel="noopener" className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white rounded-full py-3 text-sm font-bold mb-2.5 hover:opacity-90 transition-opacity">
              📲 Confirmar pelo WhatsApp
            </a>
            <button onClick={() => nav("home")} className="w-full bg-transparent border border-border rounded-full py-2.5 text-muted-foreground text-[13px] font-medium hover:bg-muted/50 transition-colors">
              ← Voltar ao início
            </button>
          </div>
        )}

        {/* ── SUCESSO ENTREGA ── */}
        {view === "entregaSucesso" && entregaSubmetida && (
          <div className="animate-in zoom-in-95 duration-400 bg-card/92 rounded-2xl p-7 shadow-md border border-border/40">
            <div className="w-16 h-16 rounded-full bg-[#25D366] text-white flex items-center justify-center text-3xl mx-auto mb-4">🛵</div>
            <h2 className="text-[22px] font-bold text-center mb-1.5 font-display">Entrega solicitada!</h2>
            <p className="text-muted-foreground text-center mb-5 text-sm">Pague a taxa via Pix e confirme pelo WhatsApp.</p>
            <div className="bg-primary/5 rounded-xl p-3 px-4 mb-5">
              {([["👤 Nome", entregaSubmetida.nome], ["📍 Endereço", entregaSubmetida.endereco], ["🏙️ Cidade", entregaSubmetida.cidade]] as const).map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-primary/10 gap-3 last:border-0">
                  <span className="text-muted-foreground font-semibold text-[13px]">{l}</span>
                  <span className="text-[13px]">{v}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 gap-3">
                <span className="text-muted-foreground font-semibold text-[13px]">💰 Taxa</span>
                <span className="text-primary font-bold text-[13px]">R$ {entregaSubmetida.taxa.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-3.5">
              <div className="text-xs font-semibold text-muted-foreground mb-2">🔑 Chave Pix para pagamento</div>
              <div className="bg-card border border-border rounded-lg p-3 font-mono text-[13px] text-foreground break-all tracking-wide mb-2.5">{entregaSubmetida.pix}</div>
              <button onClick={() => copiarPix(entregaSubmetida.pix)} className="w-full bg-primary text-primary-foreground rounded-full py-2.5 text-[13px] font-bold hover:opacity-90 transition-opacity">
                {pixCopiado ? "✓ Copiado!" : "📋 Copiar chave"}
              </button>
            </div>
            <a href={gerarWAEntrega(entregaSubmetida)} target="_blank" rel="noopener" className="flex items-center justify-center gap-2.5 bg-[#25D366] text-white rounded-full py-3 text-sm font-bold mb-2.5 hover:opacity-90 transition-opacity">
              📲 Confirmar pelo WhatsApp
            </a>
            <button onClick={() => nav("home")} className="w-full bg-transparent border border-border rounded-full py-2.5 text-muted-foreground text-[13px] font-medium hover:bg-muted/50 transition-colors">
              ← Voltar ao início
            </button>
          </div>
        )}

        {/* ── AGENDAR ── */}
        {view === "agendar" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 bg-card/92 rounded-2xl p-7 shadow-md border border-border/40">
            <h2 className="text-xl font-bold text-foreground mb-1.5 font-display">✦ Novo Agendamento</h2>
            <p className="text-muted-foreground text-[13px] mb-5">Preencha os dados para agendar sua visita à loja</p>
            <div className="flex flex-col gap-4">
              <Field label="Nome completo *" error={formErrors.nome}>
                <input className={`${inputCn} ${formErrors.nome ? inputErrorCn : ""}`} placeholder="Seu nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </Field>
              <Field label="Telefone / WhatsApp *" error={formErrors.telefone}>
                <input className={`${inputCn} ${formErrors.telefone ? inputErrorCn : ""}`} placeholder="(67) 99999-9999" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
              </Field>
              <Field label="Data da visita *" error={formErrors.data}>
                <input type="date" className={`${inputCn} ${formErrors.data ? inputErrorCn : ""}`} value={form.data} min={todayStr} onChange={e => setForm({ ...form, data: e.target.value, horario: "" })} />
                {form.data && getDiaSemana(form.data) === 6 && (
                  <span className="text-[11px] text-muted-foreground mt-1">📅 Sábado: atendimento até 16:00</span>
                )}
                {form.data && getDiaSemana(form.data) === 0 && (
                  <span className="text-[11px] text-destructive mt-1">🚫 Domingo: loja fechada</span>
                )}
              </Field>
              <Field label="Horário *" error={formErrors.horario}>
                {form.data && getDiaSemana(form.data) === 0 ? (
                  <div className="text-[13px] text-destructive py-2">Selecione outro dia — domingos não atendemos.</div>
                ) : form.data ? (
                  <div className="flex flex-wrap gap-2">
                    {horariosDisponiveis.map(h => {
                      const oc = horariosOcupados.includes(h);
                      return (
                        <button key={h} disabled={oc} onClick={() => !oc && setForm({ ...form, horario: h })} className={`${pillCn} ${form.horario === h ? pillActive : oc ? "opacity-40 cursor-not-allowed line-through border-border text-muted-foreground" : pillInactive}`}>
                          {h}{oc ? " ✗" : ""}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[13px] text-muted-foreground py-2">Selecione uma data primeiro.</div>
                )}
              </Field>
            </div>
            <button onClick={handleSubmit} className="mt-5 w-full bg-primary text-primary-foreground rounded-full py-3.5 text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity">
              Confirmar Agendamento ✦
            </button>
          </div>
        )}

        {/* ── LISTA ── */}
        {view === "lista" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="flex items-start justify-between flex-wrap gap-2.5 mb-4">
              <h2 className="text-xl font-bold text-foreground font-display">✦ Agendamentos</h2>
              <div className="flex gap-1.5">
                {(["todos", "confirmado", "pendente"] as const).map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)} className={`${pillCn} ${filterStatus === f ? pillActive : pillInactive}`}>
                    {f === "todos" ? "Todos" : f === "confirmado" ? "Confirmados" : "Pendentes"}
                  </button>
                ))}
              </div>
            </div>
            {agsFiltrados.length === 0 && <div className="text-center text-muted-foreground py-12 text-sm">Nenhum agendamento encontrado.</div>}
            <div className="flex flex-col gap-2.5">
              {[...agsFiltrados].sort((a, b) => a.data.localeCompare(b.data)).map(ag => (
                <div key={ag.id} className="bg-card/92 rounded-xl px-4 py-3.5 shadow-sm border border-border/40">
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{ag.nome}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">📋 {ag.servico}</div>
                    </div>
                    <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold whitespace-nowrap ${ag.status === "confirmado" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {ag.status === "confirmado" ? "✓ Confirmado" : "⏳ Pendente"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">📅 {ag.data} às {ag.horario}</span>
                    <a href={gerarWA(ag)} target="_blank" rel="noopener" className="bg-[#25D366] text-white rounded-full px-3.5 py-1 text-[11px] font-bold hover:opacity-90 transition-opacity">
                      📲 WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CALENDÁRIO ── */}
        {view === "calendario" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h2 className="text-xl font-bold text-foreground font-display mb-4">✦ Calendário</h2>
            <div className="bg-card/92 rounded-2xl p-5 shadow-sm border border-border/40 mb-4">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-primary hover:bg-primary/5 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-base font-semibold font-display">{MESES[calMonth]} {calYear}</span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-primary hover:bg-primary/5 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DIAS_SEMANA.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1 tracking-wide">{d}</div>)}
                {Array(firstDay).fill(null).map((_, i) => <div key={"e" + i} />)}
                {Array(daysInMonth).fill(null).map((_, i) => {
                  const day = i + 1;
                  const key = dateKey(calYear, calMonth, day);
                  const ags = agsPorDia[key] || [];
                  const isT = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                  const isSel = calSelected === key;
                  const diaSem = new Date(calYear, calMonth, day).getDay();
                  const isDom = diaSem === 0;
                  return (
                    <div key={day} onClick={() => !isDom && setCalSelected(isSel ? null : key)}
                      className={`text-center rounded-lg py-1.5 px-0.5 text-xs relative transition-all cursor-pointer select-none
                        ${isSel ? "bg-primary text-primary-foreground font-bold" : isT ? "bg-primary/10 text-primary font-bold" : isDom ? "text-muted-foreground/40 cursor-default" : "text-foreground hover:bg-muted/50"}
                        ${ags.length > 0 && !isSel ? "ring-1 ring-primary/40" : ""}
                        ${isDom ? "opacity-40" : ""}`}>
                      {day}
                      {ags.length > 0 && (
                        <span className={`absolute bottom-0 right-0.5 text-[8px] rounded-full px-1 font-bold ${isSel ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>
                          {ags.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {calSelected && agsPorDia[calSelected] && (
              <div className="bg-card/92 rounded-xl p-4 border border-border/40">
                <h3 className="text-[13px] font-semibold text-muted-foreground mb-2.5">Agendamentos em {calSelected}</h3>
                {agsPorDia[calSelected].map(ag => (
                  <div key={ag.id} className="py-2 border-b border-primary/10 text-[13px] flex items-center gap-2 last:border-0">
                    <strong>{ag.horario}</strong> — {ag.nome}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ml-1 ${ag.status === "confirmado" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {ag.status === "confirmado" ? "✓" : "⏳"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {calSelected && !agsPorDia[calSelected] && (
              <div className="text-center text-muted-foreground py-7 text-[13px]">Nenhum agendamento neste dia.</div>
            )}
          </div>
        )}

        {/* ── ENTREGAS ── */}
        {view === "entregas" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 bg-card/92 rounded-2xl p-7 shadow-md border border-border/40">
            <h2 className="text-xl font-bold text-foreground mb-1.5 font-display">🛵 Solicitar Entrega</h2>
            <p className="text-muted-foreground text-[13px] mb-5">Receba seus produtos em casa. Atendemos Corumbá e Ladário.</p>
            <div className="flex gap-3 mb-5">
              {Object.entries(TAXA_ENTREGA).map(([c, t]) => (
                <div key={c} className="flex-1 bg-primary/5 rounded-xl p-3.5 text-center border border-border/40">
                  <div className="text-[13px] text-muted-foreground mb-1">{c === "Corumbá" ? "🏙️" : "🏘️"} {c}</div>
                  <div className="text-xl font-bold text-primary font-display">R$ {t.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <Field label="Seu nome *" error={entregaErrors.nome}>
                <input className={`${inputCn} ${entregaErrors.nome ? inputErrorCn : ""}`} placeholder="Nome completo" value={entregaForm.nome} onChange={e => setEntregaForm({ ...entregaForm, nome: e.target.value })} />
              </Field>
              <Field label="Endereço de entrega *" error={entregaErrors.endereco}>
                <input className={`${inputCn} ${entregaErrors.endereco ? inputErrorCn : ""}`} placeholder="Rua, número, bairro..." value={entregaForm.endereco} onChange={e => setEntregaForm({ ...entregaForm, endereco: e.target.value })} />
              </Field>
              <Field label="Cidade *" error={entregaErrors.cidade}>
                <div className="flex gap-2.5 flex-wrap">
                  {(["Corumbá", "Ladário"] as const).map(c => (
                    <button key={c} onClick={() => setEntregaForm({ ...entregaForm, cidade: c })}
                      className={`flex-1 min-w-[120px] border rounded-xl py-3 px-2 flex flex-col items-center gap-1 text-[13px] font-medium transition-all
                        ${entregaForm.cidade === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
                      {c === "Corumbá" ? "🏙️" : "🏘️"} {c}
                      <span className="text-[11px] font-bold">R$ {TAXA_ENTREGA[c].toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            {entregaForm.cidade && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-[13px] text-muted-foreground mt-2">
                💰 Taxa para <strong>{entregaForm.cidade}</strong>: <strong className="text-primary">R$ {TAXA_ENTREGA[entregaForm.cidade].toFixed(2)}</strong>
              </div>
            )}
            <button onClick={handleEntregaSubmit} className="mt-5 w-full bg-primary text-primary-foreground rounded-full py-3.5 text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity">
              Solicitar Entrega & Gerar Pix ✦
            </button>
          </div>
        )}

        {/* ── PIX ── */}
        {view === "pix" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 bg-card/92 rounded-2xl p-7 shadow-md border border-border/40">
            <h2 className="text-xl font-bold text-foreground mb-1.5 font-display">💳 Gerador de Chave Pix</h2>
            <p className="text-muted-foreground text-[13px] mb-5">Gere uma chave Pix aleatória para pagamento da taxa de entrega.</p>
            <Field label="Cidade de entrega (opcional)">
              <div className="flex gap-2.5 flex-wrap">
                {([["", "Sem seleção"], ["Corumbá", "🏙️ Corumbá"], ["Ladário", "🏘️ Ladário"]] as const).map(([c, lbl]) => (
                  <button key={c || "none"} onClick={() => setPixCidade(c)}
                    className={`flex-1 min-w-[100px] border rounded-xl py-2.5 px-2 flex flex-col items-center gap-1 text-xs font-medium transition-all
                      ${pixCidade === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
                    {lbl}
                    {c && <span className="text-[11px] font-bold">R$ {TAXA_ENTREGA[c as string].toFixed(2)}</span>}
                  </button>
                ))}
              </div>
            </Field>
            <button onClick={handleGerarPix} className="mt-5 w-full bg-primary text-primary-foreground rounded-full py-3.5 text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity">
              🔑 Gerar Chave Pix Aleatória
            </button>
            {pixGerado && (
              <div className="mt-5 bg-primary/5 border border-primary/25 rounded-2xl p-5 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">💳</span>
                  <div>
                    <div className="text-[15px] font-bold text-foreground font-display">Chave Pix gerada!</div>
                    {pixGerado.cidade && <div className="text-xs text-muted-foreground mt-0.5">Taxa: <strong className="text-primary">R$ {pixGerado.taxa!.toFixed(2)}</strong> — {pixGerado.cidade}</div>}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 font-mono text-[13px] text-foreground break-all tracking-wide mb-2.5">{pixGerado.chave}</div>
                <button onClick={() => copiarPix(pixGerado.chave)} className="w-full bg-primary text-primary-foreground rounded-full py-2.5 text-[13px] font-bold hover:opacity-90 transition-opacity mb-3.5">
                  {pixCopiado ? "✓ Copiado!" : "📋 Copiar chave"}
                </button>
                <div className="flex flex-col gap-2 mb-2">
                  {["Copie a chave Pix acima", "Abra seu banco e faça o Pix", "Envie o comprovante pelo WhatsApp"].map((st, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {st}
                    </div>
                  ))}
                </div>
                <button onClick={handleGerarPix} className="w-full bg-transparent border border-primary text-primary rounded-full py-2.5 text-sm font-semibold hover:bg-primary/5 transition-colors">
                  🔄 Gerar nova chave
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {view === "admin" && (
          !adminAuth ? (
            <div className="animate-in zoom-in-95 duration-400 bg-card/92 rounded-2xl p-7 shadow-md border border-border/40 max-w-[360px] mx-auto mt-10">
              <div className="text-center mb-6">
                <div className="text-[44px] mb-2.5">🔒</div>
                <h2 className="text-xl font-bold text-foreground font-display mb-1">Área da Wgimenes</h2>
                <p className="text-muted-foreground text-[13px]">Acesso exclusivo para gerenciar horários e agendamentos</p>
              </div>
              <Field label="Senha" error={adminErro ? "Senha incorreta. Tente novamente." : null}>
                <input type="password" className={`${inputCn} ${adminErro ? inputErrorCn : ""}`} placeholder="••••••••••" value={adminSenha}
                  onChange={e => { setAdminSenha(e.target.value); setAdminErro(false); }}
                  onKeyDown={e => e.key === "Enter" && handleAdminLogin()} />
              </Field>
              <button onClick={handleAdminLogin} className="mt-5 w-full bg-primary text-primary-foreground rounded-full py-3.5 text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity">
                Entrar ✦
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="flex justify-between items-center mb-5 flex-wrap gap-2.5">
                <div>
                  <h2 className="text-xl font-bold text-foreground font-display mb-0.5">🔒 Gestão — Wgimenes</h2>
                  <p className="text-xs text-muted-foreground">Gerencie horários bloqueados e agendamentos</p>
                </div>
                <button onClick={() => { setAdminAuth(false); setAdminSenha(""); }} className={`${pillCn} ${pillInactive}`}>
                  Sair 🚪
                </button>
              </div>

              <div className="flex gap-2 mb-5">
                {([["bloqueios", "📅 Bloquear Horários"], ["agendamentos", `📋 Agendamentos (${agendamentos.length})`]] as const).map(([t, l]) => (
                  <button key={t} onClick={() => setAdminTab(t)} className={`${pillCn} px-4 py-2 text-xs font-semibold ${adminTab === t ? pillActive : pillInactive}`}>
                    {l}
                  </button>
                ))}
              </div>

              {adminTab === "bloqueios" && (
                <div className="bg-card/92 rounded-2xl p-6 shadow-md border border-border/40">
                  <h3 className="text-base font-bold text-foreground font-display mb-1.5">Bloquear Horários</h3>
                  <p className="text-muted-foreground text-[13px] mb-5">Selecione uma data e clique nos horários para bloquear.</p>
                  <Field label="Selecione a data">
                    <input type="date" className={inputCn} value={adminData} min={todayStr} onChange={e => setAdminData(e.target.value)} />
                  </Field>
                  {adminData && (
                    getDiaSemana(adminData) === 0 ? (
                      <div className="text-center bg-primary/5 border border-border rounded-xl p-5 mt-4 text-muted-foreground text-sm">
                        🚫 Domingo — loja fechada, sem atendimento.
                      </div>
                    ) : (
                      <div className="mt-4">
                        {getDiaSemana(adminData) === 6 && (
                          <div className="text-[11px] text-muted-foreground mb-2.5 bg-primary/5 rounded-lg p-2 px-3">
                            📅 Sábado — horários até 15:00 (16:00 encerramento)
                          </div>
                        )}
                        <div className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">Clique para bloquear / desbloquear:</div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {adminHorariosDisponiveis.map(h => {
                            const bloq = adminBloqueiosDia.includes(h);
                            const agend = adminAgsDia.some(a => a.horario === h && a.status !== "cancelado");
                            return (
                              <button key={h} onClick={() => { if (!agend) toggleBloqueio(adminData, h); }}
                                title={agend ? "Já existe agendamento" : bloq ? "Desbloquear" : "Bloquear"}
                                className={`rounded-full px-4 py-2 text-[13px] font-bold border-2 transition-all
                                  ${bloq ? "bg-destructive text-destructive-foreground border-destructive" : agend ? "bg-primary/10 text-primary border-primary/50 cursor-default" : "bg-card text-muted-foreground border-border hover:border-primary/50 cursor-pointer"}`}>
                                {h} {bloq ? "🚫" : agend ? "📅" : "✓"}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-3.5 flex-wrap text-[11px] text-muted-foreground pt-2.5 border-t border-border/60">
                          <span>✓ Livre</span>
                          <span>🚫 Bloqueado por você</span>
                          <span>📅 Já agendado</span>
                        </div>
                        {adminBloqueiosDia.length > 0 && (
                          <div className="mt-3.5 bg-primary/5 border border-border rounded-lg p-2.5 px-3.5 text-xs text-muted-foreground">
                            🚫 Bloqueados neste dia: <strong className="text-primary">{adminBloqueiosDia.join(", ")}</strong>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {adminTab === "agendamentos" && (
                <div>
                  <div className="flex gap-2.5 mb-4 flex-wrap">
                    {[
                      { n: agendamentos.filter(a => a.status === "pendente").length, l: "Pendentes", cn: "bg-warning/15 text-warning" },
                      { n: agendamentos.filter(a => a.status === "confirmado").length, l: "Confirmados", cn: "bg-success/15 text-success" },
                      { n: agendamentos.filter(a => a.status === "cancelado").length, l: "Cancelados", cn: "bg-destructive/15 text-destructive" },
                    ].map((s, i) => (
                      <div key={i} className={`flex-1 min-w-[90px] rounded-xl p-3 text-center border border-current/10 ${s.cn}`}>
                        <div className="text-xl font-bold font-display">{s.n}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {agendamentos.length === 0 && <div className="text-center text-muted-foreground py-14 text-sm">Nenhum agendamento ainda.</div>}
                  <div className="flex flex-col gap-2.5">
                    {[...agendamentos].sort((a, b) => a.data.localeCompare(b.data)).map(ag => (
                      <div key={ag.id} className={`bg-card/92 rounded-xl px-4 py-3.5 shadow-sm border border-border/40 transition-opacity ${ag.status === "cancelado" ? "opacity-50" : ""}`}>
                        <div className="flex justify-between items-start mb-2.5 gap-2">
                          <div>
                            <div className="text-[15px] font-bold text-foreground">{ag.nome}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">📅 {ag.data} | 🕐 {ag.horario}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">📱 {ag.telefone}</div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold whitespace-nowrap
                            ${ag.status === "confirmado" ? "bg-success/15 text-success" : ag.status === "cancelado" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                            {ag.status === "confirmado" ? "✓ Confirmado" : ag.status === "cancelado" ? "✗ Cancelado" : "⏳ Pendente"}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {ag.status !== "confirmado" && ag.status !== "cancelado" && (
                            <button onClick={() => alterarStatus(ag.id, "confirmado")} className="rounded-full px-3.5 py-1 bg-success/15 text-success text-[11px] font-bold hover:bg-success/25 transition-colors">✓ Confirmar</button>
                          )}
                          {ag.status === "confirmado" && (
                            <button onClick={() => alterarStatus(ag.id, "pendente")} className="rounded-full px-3.5 py-1 bg-warning/15 text-warning text-[11px] font-bold hover:bg-warning/25 transition-colors">↩ Pendente</button>
                          )}
                          {ag.status !== "cancelado" && (
                            <button onClick={() => alterarStatus(ag.id, "cancelado")} className="rounded-full px-3.5 py-1 bg-destructive/15 text-destructive text-[11px] font-bold hover:bg-destructive/25 transition-colors">✗ Cancelar</button>
                          )}
                          <button onClick={() => deletarAg(ag.id)} className="rounded-full px-3.5 py-1 bg-muted text-muted-foreground text-[11px] font-bold hover:bg-muted/80 transition-colors">🗑️ Excluir</button>
                          <a href={gerarWA(ag)} target="_blank" rel="noopener" className="rounded-full px-3.5 py-1 bg-[#25D366] text-white text-[11px] font-bold inline-flex items-center gap-1 hover:opacity-90 transition-opacity">📲 WhatsApp</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </main>

      <footer className="text-center py-5 text-muted-foreground text-[11px] tracking-wider border-t border-border/40 bg-background/80">
        © 2026 WGimenes Cosméticos & Perfumes · Corumbá & Ladário, MS
      </footer>
    </div>
  );
}
