import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check,
  CircleDollarSign, FileText, Minus, Pencil, Plus, Search, Trash2, TrendingUp, Wallet, X
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip,
  XAxis, YAxis
} from 'recharts';
import './finance.css';

const expenseCategories = [
  'Aluguel', 'Produtos e materiais', 'Equipamentos', 'Água e energia',
  'Internet', 'Marketing', 'Funcionários', 'Outros'
];
const paymentMethods = ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Transferência bancária', 'Outro'];
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const dateLabel = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', options).replace('.', '') : '—';
const monthLabel = (key, options = { month: 'short' }) =>
  new Date(`${key}-01T12:00:00`).toLocaleDateString('pt-BR', options).replace('.', '');
const sameMonth = (date, monthKey) => Boolean(date && date.slice(0, 7) === monthKey);
const monthKeyFromDate = (date) => date.slice(0, 7);
const shiftMonth = (date, offset) => {
  const d = new Date(`${String(date).slice(0, 10)}T12:00:00`);
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const isCanceled = (status) => ['cancelada', 'cancelado', 'canceled', 'cancelled'].includes(String(status || '').toLowerCase());
const appointmentIndex = (appointments) => new Map((appointments || []).map((item) => [String(item.id), item]));

function classifyRevenues(revenues, appointments) {
  const apptById = appointmentIndex(appointments);
  const claimed = new Set();
  const sorted = [...(revenues || [])].sort((a, b) =>
    Number(b.paymentStatus === 'Recebido') - Number(a.paymentStatus === 'Recebido')
      || String(a.date || '').localeCompare(String(b.date || ''))
      || String(a.id).localeCompare(String(b.id))
  );
  const classification = new Map();
  sorted.forEach((item) => {
    const hasAppointment = item.appointmentId !== undefined && item.appointmentId !== null && item.appointmentId !== '';
    const appointment = hasAppointment ? apptById.get(String(item.appointmentId)) : null;
    if (hasAppointment) {
      if (!appointment) {
        classification.set(String(item.id), { eligible: false, label: 'Agendamento não encontrado', reason: 'missing-appointment' });
        return;
      }
      if (isCanceled(appointment.status)) {
        classification.set(String(item.id), { eligible: false, label: 'Agendamento cancelado', reason: 'canceled' });
        return;
      }
    }
    if (item.paymentStatus === 'Recebido' && item.date > todayISO()) {
      classification.set(String(item.id), { eligible: false, label: 'Data futura · não recebido', reason: 'future-transaction' });
      return;
    }
    if (item.paymentStatus === 'Recebido' && appointment?.date > todayISO()) {
      classification.set(String(item.id), { eligible: false, label: 'Atendimento futuro · não recebido', reason: 'future-appointment' });
      return;
    }
    if (hasAppointment) {
      if (claimed.has(String(item.appointmentId))) {
        classification.set(String(item.id), { eligible: false, label: 'Duplicado · já contabilizado', reason: 'duplicate' });
        return;
      }
      claimed.add(String(item.appointmentId));
    }
    if (item.paymentStatus !== 'Recebido') {
      const label = item.date > todayISO()
        ? 'Pendente · data futura'
        : appointment?.date > todayISO() ? 'Pendente · atendimento futuro' : 'Pendente';
      classification.set(String(item.id), { eligible: false, label, reason: 'pending' });
      return;
    }
    classification.set(String(item.id), { eligible: true, label: 'Recebido · contabilizado', reason: 'eligible' });
  });
  return classification;
}

const filterByRange = (date, start, end) => Boolean(date && date >= start && date <= end);
const getPeriod = (selection) => {
  if (selection.mode === 'range') return { start: selection.start, end: selection.end };
  if (selection.mode === 'year') return { start: `${selection.year}-01-01`, end: `${selection.year}-12-31` };
  const monthValue = /^\d{4}-\d{2}$/.test(selection.month || '') ? selection.month : todayISO().slice(0, 7);
  const [year, month] = monthValue.split('-');
  const last = new Date(Number(year), Number(month), 0).getDate();
  return { start: `${monthValue}-01`, end: `${monthValue}-${String(last).padStart(2, '0')}` };
};
const blankRevenue = () => ({ description: '', client: '', procedure: '', amount: '', date: todayISO(), paymentMethod: 'Pix', paymentStatus: 'Recebido', appointmentId: '' });
const blankExpense = () => ({ name: '', category: 'Produtos e materiais', amount: '', date: todayISO(), paymentMethod: 'Pix', description: '' });

function MetricCard({ label, value, note, icon: Icon, tone = 'rose', testId }) {
  return <article className={`finance-metric finance-metric-${tone}`} data-testid={`card-${testId}`}>
    <div className="finance-metric-top"><span>{label}</span><span className="finance-metric-icon"><Icon size={17} /></span></div>
    <strong data-testid={`value-${testId}`}>{value}</strong>
    <small>{note}</small>
  </article>;
}

function FinanceHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading finance-heading">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>
    {action}
  </div>;
}

function EmptyFinance({ title, text, action }) {
  return <div className="empty-state finance-empty"><span className="finance-empty-icon"><FileText size={20} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function RevenueForm({ initial, appointments, clients, services, onClose, onSave, notify, revenues }) {
  const [form, setForm] = useState(initial || blankRevenue());
  const [error, setError] = useState('');
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const linkedElsewhere = new Set((revenues || [])
    .filter((item) => String(item.id) !== String(initial?.id) && item.appointmentId !== undefined && item.appointmentId !== null && item.appointmentId !== '')
    .map((item) => String(item.appointmentId)));
  const availableAppointments = (appointments || []).filter((item) => !linkedElsewhere.has(String(item.id)));
  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim() || !form.date || !form.paymentMethod || !form.paymentStatus) {
      setError('Preencha a descrição, a data, a forma de pagamento e o status.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (form.appointmentId && linkedElsewhere.has(String(form.appointmentId))) {
      setError('Este agendamento já está associado a outro lançamento.');
      return;
    }
    const selected = (appointments || []).find((item) => String(item.id) === String(form.appointmentId));
    const payload = {
      ...form,
      description: form.description.trim(),
      amount,
      ...(selected ? { client: selected.client, procedure: selected.service } : {}),
      ...(form.appointmentId ? { appointmentId: form.appointmentId } : { appointmentId: undefined }),
      ...(!selected ? {
        ...(form.client ? { client: form.client } : { client: undefined }),
        ...(form.procedure ? { procedure: form.procedure } : { procedure: undefined })
      } : {}),
      ...(initial ? { id: initial.id } : { id: `rev-${Date.now()}` })
    };
    onSave(payload);
    notify(initial ? 'Receita atualizada.' : 'Receita registrada.');
    onClose();
  };
  return <div className="finance-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="finance-modal" role="dialog" aria-modal="true" aria-labelledby="revenue-form-title">
      <header className="finance-modal-head"><div><span className="finance-modal-kicker">Lançamento financeiro</span><h2 id="revenue-form-title">{initial ? 'Editar receita' : 'Registrar receita'}</h2><p>Agendamentos não significam recebimento. Registre apenas o valor efetivamente combinado.</p></div><button className="small-icon" type="button" onClick={onClose} aria-label="Fechar formulário de receita" data-testid="button-close-revenue-form"><X size={17} /></button></header>
      <form onSubmit={submit} noValidate>
        <div className="form-grid finance-form-grid">
          <div className="field span-2"><label htmlFor="revenue-description">Descrição *</label><input id="revenue-description" data-testid="input-revenue-description" value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Ex.: Sessão de peeling facial" /></div>
          <div className="field"><label htmlFor="revenue-client">Cliente (opcional)</label><select id="revenue-client" data-testid="select-revenue-client" value={form.client || ''} onChange={(event) => setField('client', event.target.value)}><option value="">Sem cliente associado</option>{(clients || []).map((client, index) => <option key={client.id ?? `${client.name}-${index}`} value={client.name}>{client.name}</option>)}</select></div>
          <div className="field"><label htmlFor="revenue-procedure">Procedimento (opcional)</label><select id="revenue-procedure" data-testid="select-revenue-procedure" value={form.procedure || ''} onChange={(event) => setField('procedure', event.target.value)}><option value="">Sem procedimento</option>{(services || []).map((service, index) => <option key={service.id ?? `${service.name}-${index}`} value={service.name}>{service.name}</option>)}</select></div>
          <div className="field"><label htmlFor="revenue-amount">Valor (R$) *</label><input id="revenue-amount" data-testid="input-revenue-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setField('amount', event.target.value)} placeholder="0,00" /></div>
          <div className="field"><label htmlFor="revenue-date">Data *</label><input id="revenue-date" data-testid="input-revenue-date" type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} /></div>
          <div className="field"><label htmlFor="revenue-method">Forma de pagamento *</label><select id="revenue-method" data-testid="select-revenue-method" value={form.paymentMethod} onChange={(event) => setField('paymentMethod', event.target.value)}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></div>
          <div className="field"><label htmlFor="revenue-status">Status *</label><select id="revenue-status" data-testid="select-revenue-status" value={form.paymentStatus} onChange={(event) => setField('paymentStatus', event.target.value)}><option>Recebido</option><option>Pendente</option></select></div>
          <div className="field span-2"><label htmlFor="revenue-appointment">Agendamento associado (opcional)</label><select id="revenue-appointment" data-testid="select-revenue-appointment" value={form.appointmentId || ''} onChange={(event) => setField('appointmentId', event.target.value)}><option value="">Nenhum agendamento</option>{availableAppointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.date} · {appointment.time} · {appointment.client} — {appointment.service}</option>)}</select><small className="finance-field-note">Agendamentos cancelados ou futuros não entram no total recebido.</small></div>
        </div>
        {error && <p className="finance-form-error" role="alert" data-testid="error-revenue-form">{error}</p>}
        <footer className="modal-footer"><button className="btn secondary" type="button" onClick={onClose} data-testid="button-cancel-revenue">Cancelar</button><button className="btn" type="submit" data-testid="button-save-revenue"><Check size={15} />{initial ? 'Salvar alterações' : 'Salvar receita'}</button></footer>
      </form>
    </section>
  </div>;
}

function ExpenseForm({ initial, onClose, onSave, notify }) {
  const [form, setForm] = useState(initial || blankExpense());
  const [error, setError] = useState('');
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.name.trim() || !form.category || !form.date || !form.paymentMethod) {
      setError('Preencha o nome, a categoria, a data e a forma de pagamento.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    onSave({ ...form, name: form.name.trim(), amount, description: form.description.trim(), id: initial?.id || `exp-${Date.now()}` });
    notify(initial ? 'Despesa atualizada.' : 'Despesa registrada.');
    onClose();
  };
  return <div className="finance-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="finance-modal" role="dialog" aria-modal="true" aria-labelledby="expense-form-title">
      <header className="finance-modal-head"><div><span className="finance-modal-kicker">Lançamento financeiro</span><h2 id="expense-form-title">{initial ? 'Editar despesa' : 'Registrar despesa'}</h2><p>Registre os custos da clínica para acompanhar o resultado do período.</p></div><button className="small-icon" type="button" onClick={onClose} aria-label="Fechar formulário de despesa" data-testid="button-close-expense-form"><X size={17} /></button></header>
      <form onSubmit={submit} noValidate>
        <div className="form-grid finance-form-grid">
          <div className="field span-2"><label htmlFor="expense-name">Nome da despesa *</label><input id="expense-name" data-testid="input-expense-name" value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Ex.: Compra de sérum profissional" /></div>
          <div className="field"><label htmlFor="expense-category">Categoria *</label><select id="expense-category" data-testid="select-expense-category" value={form.category} onChange={(event) => setField('category', event.target.value)}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <div className="field"><label htmlFor="expense-amount">Valor (R$) *</label><input id="expense-amount" data-testid="input-expense-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setField('amount', event.target.value)} placeholder="0,00" /></div>
          <div className="field"><label htmlFor="expense-date">Data *</label><input id="expense-date" data-testid="input-expense-date" type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} /></div>
          <div className="field"><label htmlFor="expense-method">Forma de pagamento *</label><select id="expense-method" data-testid="select-expense-method" value={form.paymentMethod} onChange={(event) => setField('paymentMethod', event.target.value)}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></div>
          <div className="field span-2"><label htmlFor="expense-description">Descrição (opcional)</label><textarea id="expense-description" data-testid="input-expense-description" value={form.description || ''} onChange={(event) => setField('description', event.target.value)} placeholder="Detalhes adicionais sobre esta despesa" /></div>
        </div>
        {error && <p className="finance-form-error" role="alert" data-testid="error-expense-form">{error}</p>}
        <footer className="modal-footer"><button className="btn secondary" type="button" onClick={onClose} data-testid="button-cancel-expense">Cancelar</button><button className="btn" type="submit" data-testid="button-save-expense"><Check size={15} />{initial ? 'Salvar alterações' : 'Salvar despesa'}</button></footer>
      </form>
    </section>
  </div>;
}

function TransactionTable({ items, type, classification, onEdit, onDelete, search, setSearch }) {
  const filtered = items.filter((item) => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return !query || [item.description, item.client, item.procedure, item.name, item.category, item.paymentMethod].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query));
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return <div className="card panel finance-panel">
    <div className="toolbar finance-toolbar">
      <label className="search-box finance-search"><Search size={16} /><input aria-label={`Buscar ${type === 'revenue' ? 'receitas' : 'despesas'}`} data-testid={`input-search-${type === 'revenue' ? 'revenues' : 'expenses'}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lançamento..." /></label>
      <span className="finance-result-count" data-testid={`text-${type}-count`}>{filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}</span>
    </div>
    {!filtered.length ? <EmptyFinance title={search ? 'Nenhum resultado encontrado' : `Nenhuma ${type === 'revenue' ? 'receita' : 'despesa'} registrada`} text={search ? 'Tente outro termo de busca.' : 'Os lançamentos registrados aparecerão aqui.'} /> :
      <div className="table-wrap finance-table-wrap"><table className="finance-table">
        <thead><tr><th>Descrição</th><th>Data</th><th>Forma</th><th>Status financeiro</th><th className="finance-amount-cell">Valor</th><th aria-label="Ações"></th></tr></thead>
        <tbody>{filtered.map((item) => {
          const isRevenue = type === 'revenue';
          const state = isRevenue ? classification.get(String(item.id)) : null;
          const title = isRevenue ? item.description : item.name;
          const secondary = isRevenue ? [item.client, item.procedure].filter(Boolean).join(' · ') : item.category;
          return <tr key={item.id} data-testid={`row-${type}-${item.id}`}>
            <td><div className="finance-transaction-name">{title || 'Lançamento'}</div><small>{secondary || (isRevenue ? 'Receita manual' : 'Sem descrição adicional')}</small></td>
            <td>{dateLabel(item.date)}</td><td>{item.paymentMethod || '—'}</td>
            <td>{isRevenue ? <span className={`finance-status ${state?.eligible ? 'is-received' : state?.reason === 'pending' ? 'is-pending' : 'is-excluded'}`} data-testid={`status-revenue-${item.id}`}>{state?.label || 'Não contabilizado'}</span> : <span className="finance-status is-expense">Despesa registrada</span>}</td>
            <td className="finance-amount-cell"><strong>{money(item.amount)}</strong></td>
            <td><div className="table-actions"><button className="small-icon" title="Editar lançamento" aria-label={`Editar ${title}`} onClick={() => onEdit(item)} data-testid={`button-edit-${type}-${item.id}`}><Pencil size={14} /></button><button className="small-icon finance-delete" title="Excluir lançamento" aria-label={`Excluir ${title}`} onClick={() => onDelete(item)} data-testid={`button-delete-${type}-${item.id}`}><Trash2 size={14} /></button></div></td>
          </tr>;
        })}</tbody>
      </table></div>}
  </div>;
}

function PeriodControls({ selection, setSelection, prefix = 'report' }) {
  const currentYear = new Date().getFullYear();
  return <div className="finance-period-controls">
    <label className="finance-filter"><span>Visualização</span><select data-testid={`select-${prefix}-period-mode`} value={selection.mode} onChange={(event) => setSelection((prev) => ({ ...prev, mode: event.target.value }))}><option value="month">Mês</option><option value="year">Ano</option><option value="range">Intervalo personalizado</option></select></label>
     {selection.mode === 'month' && <label className="finance-filter"><span>Mês</span><input type="month" data-testid={`input-${prefix}-month`} value={selection.month} onChange={(event) => setSelection((prev) => ({ ...prev, month: event.target.value || prev.month }))} /></label>}
    {selection.mode === 'year' && <label className="finance-filter"><span>Ano</span><select data-testid={`select-${prefix}-year`} value={selection.year} onChange={(event) => setSelection((prev) => ({ ...prev, year: event.target.value }))}>{Array.from({ length: 7 }, (_, index) => currentYear - 5 + index).map((year) => <option key={year}>{year}</option>)}</select></label>}
    {selection.mode === 'range' && <><label className="finance-filter"><span>De</span><input type="date" data-testid={`input-${prefix}-date-start`} value={selection.start} onChange={(event) => setSelection((prev) => ({ ...prev, start: event.target.value }))} /></label><label className="finance-filter"><span>Até</span><input type="date" data-testid={`input-${prefix}-date-end`} value={selection.end} onChange={(event) => setSelection((prev) => ({ ...prev, end: event.target.value }))} /></label></>}
  </div>;
}

function RevenueExpenseChart({ data, height = 300 }) {
  return <div className="finance-chart" style={{ height }} data-testid="chart-revenue-expenses">
    {data.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 10, left: 3, bottom: 4 }} barGap={7}>
      <CartesianGrid vertical={false} stroke="#F0E8E9" strokeDasharray="3 5" />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#93838A', fontSize: 10 }} />
      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#A9959D', fontSize: 10 }} tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toLocaleString('pt-BR')} mil` : `R$ ${value}`} width={72} />
      <Tooltip formatter={(value, name) => [money(value), name]} labelStyle={{ color: '#51434A', fontWeight: 600 }} contentStyle={{ border: '1px solid #EFE7E8', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px rgba(98,67,78,.08)' }} />
      <Legend verticalAlign="top" align="right" iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#93838A', paddingBottom: 18 }} />
      <Bar dataKey="received" name="Receita recebida" fill="#D98FA8" radius={[5, 5, 0, 0]} maxBarSize={27} />
      <Bar dataKey="expenses" name="Despesas" fill="#C5A15A" radius={[5, 5, 0, 0]} maxBarSize={27} />
    </BarChart></ResponsiveContainer> : <EmptyFinance title="Sem movimentações no período" text="Receitas elegíveis e despesas registradas serão exibidas nesta evolução." />}
  </div>;
}

function CategoryChart({ data }) {
  return <div className="finance-category-chart" data-testid="chart-expenses-category">
    {data.some((item) => item.value > 0) ? <ResponsiveContainer width="100%" height={Math.max(250, data.length * 38)}><BarChart data={data} layout="vertical" margin={{ top: 3, right: 18, left: 4, bottom: 3 }}>
      <CartesianGrid horizontal={false} stroke="#F0E8E9" strokeDasharray="3 5" />
      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#A9959D', fontSize: 10 }} tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toLocaleString('pt-BR')} mil` : `R$ ${value}`} />
      <YAxis type="category" dataKey="category" width={142} tickLine={false} axisLine={false} tick={{ fill: '#74666C', fontSize: 10 }} />
      <Tooltip formatter={(value) => [money(value), 'Despesas']} contentStyle={{ border: '1px solid #EFE7E8', borderRadius: 12, fontSize: 12 }} />
      <Bar dataKey="value" name="Despesas" fill="#EBC5D2" radius={[0, 5, 5, 0]} maxBarSize={17} />
    </BarChart></ResponsiveContainer> : <EmptyFinance title="Sem despesas por categoria" text="As despesas registradas neste período serão agrupadas aqui." />}
  </div>;
}

function ProcedureRanking({ data, compact = false }) {
  const top = data.slice(0, compact ? 5 : 8);
  return !top.length ? <EmptyFinance title="Ainda sem procedimentos recebidos" text="Receitas elegíveis associadas a procedimentos formarão este ranking." /> :
    <div className={`finance-ranking ${compact ? 'is-compact' : ''}`}>{top.map(([name, amount], index) => {
      const maximum = top[0][1] || 1;
      return <div className="finance-rank-row" key={name} data-testid={`row-procedure-ranking-${index + 1}`}><span className="finance-rank-number">{String(index + 1).padStart(2, '0')}</span><div className="finance-rank-detail"><div className="finance-rank-label"><strong>{name}</strong><span>{money(amount)}</span></div><div className="finance-rank-track"><i style={{ width: `${Math.max(4, (amount / maximum) * 100)}%` }} /></div></div></div>;
    })}</div>;
}

function RecentMovements({ revenues, expenses, classification }) {
  const entries = [
    ...revenues.map((item) => ({ ...item, kind: 'revenue', label: item.description, state: classification.get(String(item.id)) })),
    ...expenses.map((item) => ({ ...item, kind: 'expense', label: item.name }))
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  if (!entries.length) return <EmptyFinance title="Nenhuma movimentação recente" text="Novas receitas e despesas serão listadas aqui." />;
  return <div className="finance-movements">{entries.map((item) => <div className="finance-movement" key={`${item.kind}-${item.id}`} data-testid={`row-recent-movement-${item.kind}-${item.id}`}><span className={`finance-movement-mark ${item.kind}`} aria-hidden="true">{item.kind === 'revenue' ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}</span><div className="finance-movement-copy"><strong>{item.label}</strong><small>{dateLabel(item.date)} · {item.kind === 'revenue' ? item.state?.label : item.category}</small></div><b className={item.kind === 'revenue' && item.state?.eligible ? 'is-positive' : ''}>{item.kind === 'expense' ? '− ' : ''}{money(item.amount)}</b></div>)}</div>;
}

function NavigationTabs() {
  const tabs = [
    { to: '/financeiro', label: 'Visão geral', end: true, test: 'link-finance-dashboard' },
    { to: '/financeiro/receitas', label: 'Receitas', test: 'link-finance-revenues' },
    { to: '/financeiro/despesas', label: 'Despesas', test: 'link-finance-expenses' },
    { to: '/financeiro/relatorios', label: 'Relatórios', test: 'link-finance-reports' }
  ];
  return <nav className="finance-tabs" aria-label="Seções financeiras">{tabs.map((tab) => <NavLink key={tab.to} to={tab.to} end={tab.end} data-testid={tab.test} className={({ isActive }) => `finance-tab ${isActive ? 'active' : ''}`}>{tab.label}</NavLink>)}</nav>;
}

function DemoNotice() {
  return <div className="finance-demo-notice" data-testid="text-finance-demo-notice"><span>AMBIENTE DE DEMONSTRAÇÃO</span><p>Valores demonstrativos da clínica. Agendamentos futuros não são receita recebida.</p></div>;
}

export default function FinanceModule({ page = 'dashboard', finance = {}, appointments = [], clients = [], services = [], onFinanceChange = () => {}, notify = () => {} }) {
  const revenues = finance.revenues || [];
  const expenses = finance.expenses || [];
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);
  const [revenueModal, setRevenueModal] = useState(null);
  const [expenseModal, setExpenseModal] = useState(null);
  const [revenueSearch, setRevenueSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selection, setSelection] = useState({ mode: 'month', month: currentMonth, year: currentYear, start: `${currentYear}-01-01`, end: today });
  const classification = useMemo(() => classifyRevenues(revenues, appointments), [revenues, appointments]);
  const eligibleRevenues = useMemo(() => revenues.filter((item) => classification.get(String(item.id))?.eligible), [revenues, classification]);
  const pendingRevenues = useMemo(() => revenues.filter((item) => classification.get(String(item.id))?.reason === 'pending'), [revenues, classification]);
  const update = (key, item) => {
    const collection = key === 'revenues' ? revenues : expenses;
    const exists = collection.some((record) => String(record.id) === String(item.id));
    onFinanceChange({ ...finance, [key]: exists ? collection.map((record) => String(record.id) === String(item.id) ? item : record) : [item, ...collection] });
  };
  const remove = (key, item) => {
    const name = key === 'revenues' ? item.description : item.name;
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    onFinanceChange({ ...finance, [key]: (key === 'revenues' ? revenues : expenses).filter((record) => String(record.id) !== String(item.id)) });
    notify('Lançamento excluído.');
  };
  const period = getPeriod(selection);
  const periodReceived = eligibleRevenues.filter((item) => filterByRange(item.date, period.start, period.end));
  const periodExpenses = expenses.filter((item) => filterByRange(item.date, period.start, period.end));
  const receivedTotal = periodReceived.reduce((total, item) => total + Number(item.amount || 0), 0);
  const expenseTotal = periodExpenses.reduce((total, item) => total + Number(item.amount || 0), 0);
  const pendingTotal = pendingRevenues.filter((item) => filterByRange(item.date, period.start, period.end)).reduce((total, item) => total + Number(item.amount || 0), 0);
  const profit = receivedTotal - expenseTotal;
  const procedureRanking = useMemo(() => {
    const totals = new Map();
    periodReceived.forEach((item) => {
      if (item.procedure) totals.set(item.procedure, (totals.get(item.procedure) || 0) + Number(item.amount || 0));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [periodReceived]);
  const currentProcedureRanking = useMemo(() => {
    const totals = new Map();
    eligibleRevenues.filter((item) => sameMonth(item.date, currentMonth)).forEach((item) => {
      if (item.procedure) totals.set(item.procedure, (totals.get(item.procedure) || 0) + Number(item.amount || 0));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [eligibleRevenues, currentMonth]);
  const currentReceived = eligibleRevenues.filter((item) => sameMonth(item.date, currentMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const previousMonth = shiftMonth(`${today}T00:00:00`.slice(0, 10), -1);
  const previousReceived = eligibleRevenues.filter((item) => sameMonth(item.date, previousMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthDelta = currentReceived - previousReceived;
  const monthChartData = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonth(today, index - 5);
    return {
      label: monthLabel(key),
      received: eligibleRevenues.filter((item) => sameMonth(item.date, key)).reduce((sum, item) => sum + Number(item.amount || 0), 0),
      expenses: expenses.filter((item) => sameMonth(item.date, key)).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    };
  }), [today, eligibleRevenues, expenses]);
  const reportChartData = useMemo(() => {
    if (selection.mode === 'month') {
      const start = new Date(`${period.start}T12:00:00`);
      const end = new Date(`${period.end}T12:00:00`);
      return Array.from({ length: end.getDate() }, (_, index) => {
        const day = String(index + 1).padStart(2, '0');
        const key = `${selection.month}-${day}`;
        return {
          label: day,
          received: periodReceived.filter((item) => item.date === key).reduce((sum, item) => sum + Number(item.amount || 0), 0),
          expenses: periodExpenses.filter((item) => item.date === key).reduce((sum, item) => sum + Number(item.amount || 0), 0)
        };
      });
    }
    const buckets = new Map();
    const startDate = new Date(`${period.start}T12:00:00`);
    const endDate = new Date(`${period.end}T12:00:00`);
    for (let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { label: monthLabel(key, { month: 'short', year: '2-digit' }), received: 0, expenses: 0 });
    }
    periodReceived.forEach((item) => { const bucket = buckets.get(monthKeyFromDate(item.date)); if (bucket) bucket.received += Number(item.amount || 0); });
    periodExpenses.forEach((item) => { const bucket = buckets.get(monthKeyFromDate(item.date)); if (bucket) bucket.expenses += Number(item.amount || 0); });
    return [...buckets.values()];
  }, [selection, period.start, period.end, periodReceived, periodExpenses]);
  const categoryData = expenseCategories.map((category) => ({
    category,
    value: periodExpenses.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }));
  const pageTitles = {
    dashboard: ['Finanças · Sandra Soares', 'Seu resultado, com clareza', 'Recebimentos reais, custos registrados e o que merece sua atenção.'],
    receitas: ['Controle de recebimentos', 'Receitas', 'Acompanhe o que entrou — sem confundir agenda com dinheiro recebido.'],
    despesas: ['Controle de custos', 'Despesas', 'Registre os custos da clínica e acompanhe cada categoria.'],
    relatorios: ['Análise financeira', 'Relatórios', 'Uma leitura objetiva da receita recebida, dos custos e do resultado.']
  };
  const title = pageTitles[page] || pageTitles.dashboard;
  const addRevenueButton = <button className="btn" onClick={() => setRevenueModal({ mode: 'new' })} data-testid="button-new-revenue"><Plus size={15} />Registrar receita</button>;
  const addExpenseButton = <button className="btn" onClick={() => setExpenseModal({ mode: 'new' })} data-testid="button-new-expense"><Plus size={15} />Registrar despesa</button>;
  const rangeText = selection.mode === 'range' ? `${dateLabel(period.start)} – ${dateLabel(period.end)}` : selection.mode === 'year' ? selection.year : monthLabel(/^\d{4}-\d{2}$/.test(selection.month || '') ? selection.month : currentMonth, { month: 'long', year: 'numeric' });

  return <section className="finance-module" data-testid="finance-module">
    <FinanceHeading eyebrow={title[0]} title={title[1]} subtitle={title[2]} action={page === 'receitas' ? addRevenueButton : page === 'despesas' ? addExpenseButton : page === 'dashboard' ? <div className="finance-heading-actions">{addRevenueButton}{addExpenseButton}</div> : null} />
    <NavigationTabs />
    <DemoNotice />

    {page === 'dashboard' && <>
      <div className="finance-dashboard-intro"><div><span className="finance-period-label">RESUMO DE {monthLabel(currentMonth, { month: 'long', year: 'numeric' }).toLocaleUpperCase('pt-BR')}</span><p>Somente lançamentos elegíveis entram na receita recebida.</p></div><NavLink to="/financeiro/relatorios" className="finance-inline-link" data-testid="link-dashboard-reports">Ver relatórios <ArrowRight size={14} /></NavLink></div>
      <section className="finance-metrics-grid">
        <MetricCard label="Receita recebida" value={money(currentReceived)} note="Lançamentos elegíveis neste mês" icon={CircleDollarSign} testId="received-current-month" />
        <MetricCard label="Despesas registradas" value={money(expenses.filter((item) => sameMonth(item.date, currentMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0))} note="Custos lançados neste mês" icon={Wallet} tone="gold" testId="expenses-current-month" />
        <MetricCard label="Resultado estimado" value={money(currentReceived - expenses.filter((item) => sameMonth(item.date, currentMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0))} note="Recebido menos despesas registradas" icon={TrendingUp} tone="plum" testId="profit-current-month" />
        <MetricCard label="Pagamentos pendentes" value={money(pendingRevenues.filter((item) => sameMonth(item.date, currentMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0))} note="Separados da receita recebida" icon={CalendarDays} tone="sand" testId="pending-current-month" />
      </section>
      <section className="finance-dashboard-grid">
        <article className="card finance-card"><header className="finance-card-head"><div><h2>Receita recebida × despesas</h2><p>Últimos seis meses · valores efetivamente lançados</p></div><span className="finance-chart-mark">R$</span></header><RevenueExpenseChart data={monthChartData} height={282} /><div className={`finance-month-compare ${monthDelta > 0 ? 'up' : monthDelta < 0 ? 'down' : ''}`}><span>{monthDelta > 0 ? <ArrowUpRight size={15} /> : monthDelta < 0 ? <ArrowDownRight size={15} /> : <Minus size={14} />}{money(Math.abs(monthDelta))} vs. mês anterior</span><small>Receita recebida: {money(currentReceived)} · mês anterior: {money(previousReceived)}</small></div></article>
        <article className="card finance-card"><header className="finance-card-head"><div><h2>Procedimentos em destaque</h2><p>Por receita recebida neste mês</p></div><NavLink to="/financeiro/relatorios" className="finance-text-link" data-testid="link-dashboard-procedure-report">Ver ranking <ArrowRight size={13} /></NavLink></header><ProcedureRanking data={currentProcedureRanking} compact /></article>
      </section>
      <section className="finance-dashboard-grid finance-dashboard-lower">
        <article className="card finance-card"><header className="finance-card-head"><div><h2>Despesas por categoria</h2><p>Custos registrados neste mês</p></div></header><CategoryChart data={categoryData.map((item) => ({ ...item, value: expenses.filter((entry) => sameMonth(entry.date, currentMonth) && entry.category === item.category).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) }))} /></article>
        <article className="card finance-card"><header className="finance-card-head"><div><h2>Movimentações recentes</h2><p>Últimos lançamentos financeiros</p></div><NavLink to="/financeiro/receitas" className="finance-text-link" data-testid="link-dashboard-movements">Ver receitas <ArrowRight size={13} /></NavLink></header><RecentMovements revenues={revenues} expenses={expenses} classification={classification} /></article>
      </section>
      <div className="finance-footnote">A receita recebida exclui lançamentos pendentes, datas futuras, atendimentos futuros ou cancelados e duplicidades de agendamento.</div>
    </>}

    {page === 'receitas' && <>
      <div className="finance-list-summary"><div><span className="finance-period-label">TOTAL RECEBIDO NO MÊS</span><strong data-testid="value-revenues-month">{money(currentReceived)}</strong><small>{money(pendingTotal)} pendentes no período selecionado</small></div><div className="finance-list-summary-note">Um agendamento só aparece como receita quando há lançamento recebido elegível.</div></div>
      <TransactionTable items={revenues} type="revenue" classification={classification} search={revenueSearch} setSearch={setRevenueSearch} onEdit={(item) => setRevenueModal({ mode: 'edit', item })} onDelete={(item) => remove('revenues', item)} />
      <div className="finance-footnote">Status explícitos indicam quando um lançamento não foi contabilizado no total recebido.</div>
    </>}

    {page === 'despesas' && <>
      <div className="finance-list-summary expense-summary"><div><span className="finance-period-label">DESPESAS REGISTRADAS NO MÊS</span><strong data-testid="value-expenses-month">{money(expenses.filter((item) => sameMonth(item.date, currentMonth)).reduce((sum, item) => sum + Number(item.amount || 0), 0))}</strong><small>Custos lançados em {monthLabel(currentMonth, { month: 'long', year: 'numeric' })}</small></div><div className="finance-list-summary-note">As categorias ajudam a entender onde os custos da clínica se concentram.</div></div>
      <TransactionTable items={expenses} type="expense" classification={classification} search={expenseSearch} setSearch={setExpenseSearch} onEdit={(item) => setExpenseModal({ mode: 'edit', item })} onDelete={(item) => remove('expenses', item)} />
    </>}

    {page === 'relatorios' && <>
      <section className="card finance-report-filter"><div><span className="finance-period-label">PERÍODO DE ANÁLISE</span><p>Os totais usam o mesmo critério de recebimento elegível do painel.</p></div><PeriodControls selection={selection} setSelection={setSelection} /></section>
      {period.start > period.end && <div className="finance-filter-warning" role="alert" data-testid="error-report-date-range">A data inicial deve ser anterior à data final.</div>}
      <div className="finance-report-period" data-testid="text-report-period">Período: <strong>{rangeText}</strong><span>·</span> Valores em reais (R$)</div>
      <section className="finance-metrics-grid finance-report-metrics">
        <MetricCard label="Receita recebida" value={money(receivedTotal)} note="Transações elegíveis no período" icon={CircleDollarSign} testId="report-received" />
        <MetricCard label="Despesas registradas" value={money(expenseTotal)} note="Custos registrados no período" icon={Wallet} tone="gold" testId="report-expenses" />
        <MetricCard label="Resultado estimado" value={money(profit)} note="Receita recebida menos despesas" icon={TrendingUp} tone="plum" testId="report-profit" />
        <MetricCard label="Pagamentos pendentes" value={money(pendingTotal)} note="Não somados à receita recebida" icon={CalendarDays} tone="sand" testId="report-pending" />
      </section>
      <section className="card finance-card finance-report-evolution"><header className="finance-card-head"><div><h2>Evolução financeira</h2><p>Receita recebida versus despesas registradas · {rangeText}</p></div></header><RevenueExpenseChart data={period.start > period.end ? [] : reportChartData} height={310} /></section>
      <section className="finance-report-grid">
        <article className="card finance-card"><header className="finance-card-head"><div><h2>Despesas por categoria</h2><p>Distribuição dos custos no período</p></div></header><CategoryChart data={categoryData} /></article>
        <article className="card finance-card"><header className="finance-card-head"><div><h2>Procedimentos mais rentáveis</h2><p>Ordenados por receita recebida elegível</p></div></header><ProcedureRanking data={procedureRanking} /></article>
      </section>
      <div className="finance-footnote">Resultado estimado = receita recebida elegível − despesas registradas. Valores futuros não entram como receita.</div>
    </>}
    {revenueModal && <RevenueForm initial={revenueModal.item} appointments={appointments} clients={clients} services={services} revenues={revenues} onClose={() => setRevenueModal(null)} onSave={(item) => update('revenues', item)} notify={notify} />}
    {expenseModal && <ExpenseForm initial={expenseModal.item} onClose={() => setExpenseModal(null)} onSave={(item) => update('expenses', item)} notify={notify} />}
  </section>;
}
