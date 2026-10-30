import { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Clock3, CreditCard, FileText, Flower2,
  LayoutDashboard, Link2Off, Mail, MoreHorizontal, Pencil, Plus, Search, Settings,
  ShieldCheck, Sparkles, Stethoscope, Trash2, UserRound, UserRoundPlus, Users, X
} from 'lucide-react';

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const CLINIC_NAME = 'Sandra Soares';
const datePlus = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const sandraClient = {id:'sandra-soares',name:'Sandra Soares',phone:'',email:'',birth:'',visits:0,lastVisit:'',notes:''};
const initialData = {
  clients: [
    {id:1,name:'Mariana Costa',phone:'(11) 98842-1067',email:'mariana.costa@email.com',birth:'1992-04-18',visits:8,lastVisit:datePlus(-8),notes:'Prefere horários no período da manhã.'},
    {id:2,name:'Isabela Martins',phone:'(11) 99763-5201',email:'isabela.m@email.com',birth:'1988-11-02',visits:12,lastVisit:datePlus(-14),notes:'Pele sensível.'},
    {id:3,name:'Camila Nogueira',phone:'(11) 98112-7406',email:'camila.n@email.com',birth:'1995-07-23',visits:4,lastVisit:datePlus(-21),notes:''},
    {id:4,name:'Fernanda Alves',phone:'(11) 99118-8330',email:'fernanda.a@email.com',birth:'1990-02-09',visits:6,lastVisit:datePlus(-31),notes:''},
    {id:5,name:'Letícia Ribeiro',phone:'(11) 98402-1679',email:'leticia.r@email.com',birth:'1985-09-15',visits:3,lastVisit:datePlus(-47),notes:''},
    sandraClient,
  ],
  services: [
    {id:1,name:'Limpeza de pele',description:'Limpeza profunda com extração delicada e máscara calmante.',duration:60,price:180,status:'Ativo'},
    {id:2,name:'Peeling facial',description:'Renovação celular com protocolo personalizado para cada pele.',duration:45,price:240,status:'Ativo'},
    {id:3,name:'Design de sobrancelhas',description:'Mapeamento e design para valorizar o formato natural.',duration:30,price:85,status:'Ativo'},
    {id:4,name:'Drenagem linfática',description:'Técnica manual para estimular a circulação e o bem-estar.',duration:60,price:160,status:'Ativo'},
    {id:5,name:'Massagem relaxante',description:'Massagem corporal com movimentos suaves e óleos essenciais.',duration:50,price:195,status:'Inativo'},
  ],
  professionals:[
    {id:1,name:'Dra. Helena Duarte',role:'Esteticista facial',email:'helena@example.com',phone:'(11) 98201-0430',color:'#EBC5D2'},
    {id:2,name:'Bianca Ferreira',role:'Especialista corporal',email:'bianca@example.com',phone:'(11) 97742-1986',color:'#E5D2A3'},
    {id:3,name:'Lívia Monteiro',role:'Designer de sobrancelhas',email:'livia@example.com',phone:'(11) 99405-6631',color:'#D9C9E0'},
  ],
  appointments:[
    {id:1,client:'Mariana Costa',service:'Limpeza de pele',professional:'Dra. Helena Duarte',date:isoToday(),time:'09:00',status:'Confirmada',price:180},
    {id:2,client:'Isabela Martins',service:'Peeling facial',professional:'Dra. Helena Duarte',date:isoToday(),time:'10:30',status:'Pendente',price:240},
    {id:3,client:'Camila Nogueira',service:'Drenagem linfática',professional:'Bianca Ferreira',date:isoToday(),time:'13:00',status:'Confirmada',price:160},
    {id:4,client:'Fernanda Alves',service:'Design de sobrancelhas',professional:'Lívia Monteiro',date:isoToday(),time:'15:00',status:'Cancelada',price:85},
    {id:5,client:'Letícia Ribeiro',service:'Massagem relaxante',professional:'Bianca Ferreira',date:datePlus(1),time:'11:00',status:'Confirmada',price:195},
    {id:6,client:'Mariana Costa',service:'Peeling facial',professional:'Dra. Helena Duarte',date:datePlus(2),time:'14:00',status:'Pendente',price:240},
    {id:7,client:'Camila Nogueira',service:'Limpeza de pele',professional:'Dra. Helena Duarte',date:datePlus(3),time:'09:30',status:'Confirmada',price:180},
  ]
};
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);
const currency = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const fmtDate = (s, opts={day:'2-digit',month:'short'}) => s ? new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR',opts).replace('.','') : '—';
const dayName = (s) => new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'long'});
const nav = [
  {to:'/',label:'Visão geral',icon:LayoutDashboard},
  {to:'/agenda',label:'Agenda',icon:CalendarDays},
  {to:'/clientes',label:'Clientes',icon:Users},
  {to:'/servicos',label:'Serviços',icon:Sparkles},
  {to:'/profissionais',label:'Profissionais',icon:Stethoscope},
  {to:'/configuracoes',label:'Configurações',icon:Settings},
];

function useDemoData() {
  const [data,setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('atelier-demo-data'));
      if (!saved) return initialData;
      const clients = Array.isArray(saved.clients) ? saved.clients : initialData.clients;
      const professionals = Array.isArray(saved.professionals)
        ? saved.professionals.map((person) => person.email?.endsWith('@atelierpele.com')
          ? {...person,email:person.email.replace('@atelierpele.com','@example.com')}
          : person)
        : initialData.professionals;
      return {
        ...initialData,
        ...saved,
        clients: clients.some((client) => client.name === CLINIC_NAME) ? clients : [sandraClient,...clients],
        professionals,
      };
    } catch { return initialData; }
  });
  useEffect(()=>localStorage.setItem('atelier-demo-data',JSON.stringify(data)),[data]);
  const [toast,setToast] = useState(null);
  const notify = (message, error=false) => { setToast({message,error}); window.setTimeout(()=>setToast(null),3000); };
  const saveItem = (key,item) => setData(prev=>{
    const exists = prev[key].some(x=>x.id===item.id);
    return {...prev,[key]:exists?prev[key].map(x=>x.id===item.id?item:x):[{...item,id:Date.now()},...prev[key]]};
  });
  const removeItem = (key,id) => setData(prev=>({...prev,[key]:prev[key].filter(x=>x.id!==id)}));
  return {data,setData,saveItem,removeItem,toast,notify};
}

function App(){
  const store = useDemoData();
  return <AppContext.Provider value={store}><BrowserRouter><Routes>
    <Route path="/agendar" element={<PublicBooking/>}/>
    <Route path="/" element={<AdminShell/>}><Route index element={<Dashboard/>}/><Route path="agenda" element={<Agenda/>}/><Route path="clientes" element={<Clients/>}/><Route path="servicos" element={<Services/>}/><Route path="profissionais" element={<Professionals/>}/><Route path="configuracoes" element={<SettingsPage/>}/></Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes>{store.toast&&<div className={`toast ${store.toast.error?'toast-error':''}`} role="status" data-testid="status-feedback">{store.toast.message}</div>}</BrowserRouter></AppContext.Provider>;
}

function AdminShell(){
  const location=useLocation();
 const {notify}=useApp();
  const current=nav.find(n=>n.to===location.pathname)?.label||CLINIC_NAME;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Flower2 size={21}/></div><div><div className="brand-name">{CLINIC_NAME}</div><div className="brand-sub">gestão estética</div></div></div>
      <div className="nav-label">Menu principal</div><nav className="nav-list" aria-label="Navegação principal">{nav.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`nav-link ${isActive?'active':''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ','-')}`}><Icon/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="demo-box"><strong>AMBIENTE DE DEMONSTRAÇÃO</strong><p>Dados fictícios salvos somente neste navegador.</p></div><div className="profile-row"><div className="avatar">HD</div><div><div className="profile-name">Helena Duarte</div><div className="profile-role">Administradora</div></div><ChevronDown size={15} style={{marginLeft:'auto',color:'#AA9BA0'}}/></div></div>
    </aside>
     <main className="main"><header className="topbar"><div className="crumb">{CLINIC_NAME} <span style={{padding:'0 8px',color:'#D6C8CC'}}>/</span><b>{current}</b></div><div className="top-actions"><span className="top-date">{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</span><button className="icon-btn" aria-label="Avisos da demonstração" data-testid="button-notifications" onClick={()=>notify('Você está vendo dados de demonstração.')}><Bell size={16}/></button></div></header><div className="content"><Outlet/></div></main>
  </div>;
}

function PageHeading({eyebrow,title,subtitle,action,children}){
 return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle&&<p className="page-subtitle">{subtitle}</p>}</div>{action||children}</div>;
}
function Status({value,id}){return <span className={`status ${value.toLowerCase()}`} data-testid={id?`status-appointment-${id}`:`status-${value.toLowerCase()}`}>{value}</span>}
function Avatar({name}){return <div className="avatar">{name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>}
function Empty({title='Nada por aqui ainda',text='Quando houver informações, elas aparecerão nesta área.',icon:Icon=FileText,action}){return <div className="empty-state"><div className="empty-icon"><Icon size={20}/></div><h3>{title}</h3><p>{text}</p>{action}</div>}
function Metric({label,value,caption,icon:Icon}){return <div className="card kpi"><div className="kpi-top"><span>{label}</span><span className="kpi-icon"><Icon/></span></div><div className="kpi-value" data-testid={`value-${label.toLowerCase().replaceAll(' ','-')}`}>{value}</div><div className="kpi-note">{caption}</div></div>}
function AppointmentRows({items,actions=false}){
 const {setData,notify}=useApp();
 const statusAction=(id,next)=>{setData(p=>({...p,appointments:p.appointments.map(a=>a.id===id?{...a,status:next}:a)}));notify(`Agendamento atualizado para ${next.toLowerCase()}.`);};
 if(!items.length)return <Empty title="Agenda tranquila" text="Nenhum atendimento encontrado para este período." icon={CalendarDays}/>;
 return <div className="appointment-list">{items.map(a=><div className="appointment-row" key={a.id} data-testid={`row-appointment-${a.id}`}><div className="appt-time">{a.time}</div><div><div className="appt-client">{a.client}</div><div className="appt-service">{a.service} · {a.professional}</div></div><div style={{display:'flex',alignItems:'center',gap:7}}><Status value={a.status} id={a.id}/>{actions&&<select aria-label={`Ação para ${a.client}`} data-testid={`select-status-${a.id}`} value={a.status} onChange={e=>statusAction(a.id,e.target.value)} style={{border:0,background:'transparent',width:20,color:'#9A8990',fontSize:10}}><option value="Pendente">Pendente</option><option value="Confirmada">Confirmar</option><option value="Concluída">Concluir</option><option value="Cancelada">Cancelar</option></select>}</div></div>)}</div>;
}
function Dashboard(){
 const {data,notify}=useApp();
 const todays=data.appointments.filter(a=>a.date===isoToday());
 const confirmed=todays.filter(a=>a.status==='Confirmada').length;
 const pending=todays.filter(a=>a.status==='Pendente').length;
 const canceled=todays.filter(a=>a.status==='Cancelada').length;
 const upcoming=[...data.appointments].filter(a=>a.date>=isoToday()&&a.status!=='Cancelada').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
 const week=[34,43,38,55,48,64,52],rev=[42,57,46,67,53,76,61];
 return <><PageHeading eyebrow={`${new Date().toLocaleDateString('pt-BR',{weekday:'long'})} · cuidado em cada detalhe`} title="Bom dia, Helena" subtitle="Aqui está o resumo do seu espaço hoje." action={<div style={{display:'flex',gap:9,flexWrap:'wrap'}}><NavLink to="/agendar" className="btn secondary" data-testid="link-public-booking">Página de agendamento<ArrowRight size={14}/></NavLink><NavLink to="/agenda" className="btn" data-testid="button-new-appointment"><Plus/>Novo agendamento</NavLink></div>}/>
  <section className="grid kpi-grid"><Metric label="Atendimentos hoje" value={todays.length} caption="Na agenda de hoje" icon={CalendarDays}/><Metric label="Confirmados" value={confirmed} caption="Prontos para receber" icon={CheckCircle2}/><Metric label="Pendentes" value={pending} caption="Aguardando confirmação" icon={Clock3}/><Metric label="Cancelamentos" value={canceled} caption="Hoje" icon={Activity}/></section>
  <section className="grid dashboard-grid"><div className="card"><div className="card-head"><div><div className="card-title">Próximos atendimentos</div><div className="card-caption">Os próximos compromissos da clínica</div></div><NavLink to="/agenda" className="btn ghost" data-testid="link-see-calendar">Ver agenda <ArrowRight size={14}/></NavLink></div><AppointmentRows items={upcoming}/></div>
  <div className="card"><div className="card-head"><div><div className="card-title">Ritmo da semana</div><div className="card-caption">Atendimentos e receita estimada</div></div><button className="small-icon" title="Resumo demonstrativo" data-testid="button-chart-info" onClick={()=>notify('Resumo ilustrativo com dados de demonstração.')}><MoreHorizontal/></button></div><div className="chart-wrap"><div className="chart">{week.map((v,i)=><div className="bar-group" key={i}><div className="bar" style={{height:`${v}%`}}/><div className="bar alt" style={{height:`${rev[i]}%`}}/></div>)}</div><div className="chart-labels">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=><span key={x}>{x}</span>)}</div><div className="legend" style={{marginTop:14}}><span><i/>Atendimentos</span><span><i className="gold-dot"/>Receita</span></div></div></div></section>
  <div style={{fontSize:10,color:'#A9959D',marginTop:19}}>Visão demonstrativa · os dados são fictícios e salvos neste navegador.</div>
 </>;
}

function Modal({title,subtitle,onClose,children,footer}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="small-icon" onClick={onClose} aria-label="Fechar" data-testid="button-close-dialog"><X/></button></div>{children}{footer&&<div className="modal-footer">{footer}</div>}</section></div>}
function FormField({label,name,value,onChange,type='text',required=false,placeholder='',options,span=false,min,step}){return <div className={`field ${span?'span-2':''}`}><label htmlFor={name}>{label}{required?' *':''}</label>{options?<select id={name} name={name} value={value||''} onChange={onChange} required={required} data-testid={`input-${name}`}><option value="">Selecione</option>{options.map(o=><option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}</select>:<input id={name} name={name} type={type} value={value??''} onChange={onChange} required={required} placeholder={placeholder} min={min} step={step} data-testid={`input-${name}`}/>}</div>}

function Agenda(){
 const {data,setData,notify}=useApp();
 const [view,setView]=useState('Semana'); const [date,setDate]=useState(new Date()); const [open,setOpen]=useState(false);
 const shift=(n)=>{const d=new Date(date);if(view==='Mês')d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+(view==='Semana'?n*7:n));setDate(d);};
 const dayList=useMemo(()=>{
   if(view==='Mês'){
     const first=new Date(date.getFullYear(),date.getMonth(),1);first.setDate(first.getDate()-((first.getDay()+6)%7));
     return Array.from({length:42},(_,i)=>{const d=new Date(first);d.setDate(first.getDate()+i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;});
   }
   return Array.from({length:view==='Dia'?1:7},(_,i)=>{const d=new Date(date);if(view==='Semana')d.setDate(d.getDate()-((d.getDay()+6)%7)+i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;});
 },[date,view]);
 const scheduleAppts=data.appointments.filter(a=>dayList.includes(a.date));
 const title=view==='Mês'?date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):view==='Dia'?fmtDate(dayList[0],{weekday:'long',day:'numeric',month:'long'}):`${fmtDate(dayList[0])} — ${fmtDate(dayList[6])}`;
 const save=(form)=>{const fd=new FormData(form);const item=Object.fromEntries(fd);if(!item.client||!item.date||!item.time){notify('Preencha cliente, data e horário.',true);return;}item.id=Date.now();item.price=Number(item.price||0);item.status='Pendente';setData(p=>({...p,appointments:[item,...p.appointments]}));setOpen(false);notify('Agendamento adicionado à agenda.');};
 return <><PageHeading eyebrow="Organização do espaço" title="Agenda" subtitle="Acompanhe e organize os atendimentos da equipe." action={<button className="btn" onClick={()=>setOpen(true)} data-testid="button-add-appointment"><Plus/>Adicionar agendamento</button>}/>
 <div className="card panel"><div className="calendar-controls"><div style={{display:'flex',alignItems:'center',gap:12}}><div className="panel-title" style={{textTransform:'capitalize'}}>{title}</div><button className="small-icon" onClick={()=>setDate(new Date())} data-testid="button-today">Hoje</button><button className="small-icon" onClick={()=>shift(-1)} aria-label="Período anterior" data-testid="button-calendar-prev"><ChevronLeft/></button><button className="small-icon" onClick={()=>shift(1)} aria-label="Próximo período" data-testid="button-calendar-next"><ChevronRight/></button></div><div className="segmented">{['Dia','Semana','Mês'].map(x=><button key={x} className={view===x?'active':''} onClick={()=>setView(x)} data-testid={`button-calendar-${x.toLowerCase()}`}>{x}</button>)}</div></div>
 <div className="calendar-scroll" style={{marginTop:20}}><div className="calendar-grid">
 {dayList.map((d,i)=><div className="day-head" key={`h${d}`}>{new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'short'})}<br/><span style={{fontSize:15,color:'#51434A',display:'inline-block',marginTop:5}}>{new Date(`${d}T12:00:00`).getDate()}</span></div>)}
 {dayList.map(d=><div className="day-cell" key={d} data-testid={`calendar-day-${d}`}><div className="day-number">{fmtDate(d,{day:'2-digit',month:'short'})}</div>{scheduleAppts.filter(a=>a.date===d).sort((a,b)=>a.time.localeCompare(b.time)).map(a=><div className={`calendar-event ${a.status.toLowerCase()}`} key={a.id} title={`${a.client} · ${a.service} · ${a.status}`}><strong>{a.time}</strong> {a.client.split(' ')[0]}<br/>{a.service}</div>)}</div>)}
 </div></div>
 <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:10,color:'#95868C',marginTop:14}}><span><Status value="Confirmada"/></span><span><Status value="Pendente"/></span><span><Status value="Cancelada"/></span></div>
 </div>
 <div className="card" style={{marginTop:18}}><div className="card-head"><div><div className="card-title">Atendimentos do período</div><div className="card-caption">Altere o status diretamente pelo menu da linha</div></div><span className="muted" style={{fontSize:11}}>{scheduleAppts.length} agendamentos</span></div><AppointmentRows items={[...scheduleAppts].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))} actions/></div>
 {open&&<AppointmentModal onClose={()=>setOpen(false)} onSave={save}/>}
 </>;
}
function AppointmentModal({onClose,onSave}){
 const {data}=useApp();
 const [form,setForm]=useState({date:isoToday(),time:'09:00',client:'',service:'',professional:'',price:''});
 const change=e=>{const {name,value}=e.target;setForm(p=>({...p,[name]:value, ...(name==='service'?{price:data.services.find(s=>s.name===value)?.price||''}:{})}));};
 return <Modal title="Novo agendamento" subtitle="Inclua um atendimento na agenda demonstrativa." onClose={onClose} footer={<><button className="btn secondary" onClick={onClose} data-testid="button-cancel-appointment">Cancelar</button><button form="appointment-form" className="btn" data-testid="button-save-appointment">Salvar agendamento</button></>}>
 <form id="appointment-form" onSubmit={e=>{e.preventDefault();onSave(e.currentTarget);}}><div className="form-grid">
 <FormField label="Cliente" name="client" value={form.client} onChange={change} required options={data.clients.map(x=>x.name)}/><FormField label="Procedimento" name="service" value={form.service} onChange={change} required options={data.services.filter(x=>x.status==='Ativo').map(x=>x.name)}/>
 <FormField label="Profissional" name="professional" value={form.professional} onChange={change} required options={data.professionals.map(x=>x.name)}/><FormField label="Data" name="date" type="date" value={form.date} onChange={change} required/>
 <FormField label="Horário" name="time" type="time" value={form.time} onChange={change} required/><FormField label="Valor (R$)" name="price" type="number" min="0" step="0.01" value={form.price} onChange={change}/>
 </div></form>
 </Modal>;
}

function Clients(){
 const {data,saveItem,removeItem,notify}=useApp();const [query,setQuery]=useState('');const [selected,setSelected]=useState(null);const [editing,setEditing]=useState(null);const [showForm,setShowForm]=useState(false);
 const rows=data.clients.filter(c=>`${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase()));
 const save=(form)=>{const fd=new FormData(form);const item={...Object.fromEntries(fd),id:editing?.id||Date.now(),visits:editing?.visits||0,lastVisit:editing?.lastVisit||''};saveItem('clients',item);setShowForm(false);setEditing(null);notify(editing?'Cadastro atualizado.':'Cliente cadastrado.');};
 const erase=(c)=>{if(window.confirm(`Remover ${c.name} da lista de clientes?`)){removeItem('clients',c.id);setSelected(null);notify('Cliente removido da demonstração.');}};
 return <><PageHeading eyebrow="Relacionamento e cuidado" title="Clientes" subtitle={`${data.clients.length} cadastros fictícios neste espaço.`} action={<button className="btn" onClick={()=>{setEditing(null);setShowForm(true)}} data-testid="button-new-client"><UserRoundPlus/>Novo cliente</button>}/>
 <div className="card panel"><div className="panel-head"><div><div className="panel-title">Sua base de clientes</div><div className="panel-sub">Busque por nome, telefone ou e-mail.</div></div><div className="search-box"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente..." aria-label="Buscar cliente" data-testid="input-search-clients"/></div></div>
 <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Contato</th><th>Atendimentos</th><th>Última visita</th><th></th></tr></thead><tbody>{rows.map(c=><tr key={c.id} data-testid={`row-client-${c.id}`}><td><button onClick={()=>setSelected(c)} style={{border:0,background:'transparent',padding:0,textAlign:'left'}} data-testid={`button-client-details-${c.id}`}><span className="person-cell"><Avatar name={c.name}/><span>{c.name}</span></span></button></td><td><div>{c.phone}</div><div className="muted" style={{fontSize:10,marginTop:3}}>{c.email}</div></td><td>{c.visits}</td><td>{fmtDate(c.lastVisit)}</td><td><div className="table-actions"><button className="small-icon" aria-label={`Editar ${c.name}`} onClick={()=>{setEditing(c);setShowForm(true)}} data-testid={`button-edit-client-${c.id}`}><Pencil/></button><button className="small-icon" aria-label={`Excluir ${c.name}`} onClick={()=>erase(c)} data-testid={`button-delete-client-${c.id}`}><Trash2/></button></div></td></tr>)}</tbody></table></div>
 {rows.length===0&&<Empty title={query?'Nenhum resultado':'Nenhum cliente cadastrado'} text={query?'Tente outro nome, telefone ou e-mail.':'Cadastre a primeira pessoa atendida pela clínica.'} icon={Users} action={!query&&<button className="btn" onClick={()=>setShowForm(true)} data-testid="button-empty-new-client"><Plus/>Cadastrar cliente</button>}/>}
 </div>
 {showForm&&<ClientForm initial={editing} onClose={()=>setShowForm(false)} onSave={save}/>}
 {selected&&<Modal title={selected.name} subtitle="Ficha demonstrativa do cliente" onClose={()=>setSelected(null)} footer={<><button className="btn secondary" onClick={()=>setSelected(null)} data-testid="button-close-client-history">Fechar</button><button className="btn" onClick={()=>{setEditing(selected);setSelected(null);setShowForm(true)}} data-testid="button-edit-client-details"><Pencil/>Editar cadastro</button></>}><div className="card" style={{padding:16,background:'#FCF8F9',boxShadow:'none'}}><div className="person-cell"><Avatar name={selected.name}/><div><strong>{selected.phone}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{selected.email}</div></div></div></div><div style={{marginTop:20}}><div className="panel-title">Histórico de atendimentos</div><div style={{paddingTop:9}}>{data.appointments.filter(a=>a.client===selected.name).length?data.appointments.filter(a=>a.client===selected.name).map(a=><div className="setting-row" key={a.id}><div><b style={{fontSize:12}}>{a.service}</b><div className="muted" style={{fontSize:10,marginTop:4}}>{fmtDate(a.date,{day:'2-digit',month:'long',year:'numeric'})} · {a.time} · {a.professional}</div></div><Status value={a.status}/></div>):<div className="muted" style={{fontSize:12,padding:15}}>Ainda não há atendimentos registrados.</div>}</div><p className="muted" style={{fontSize:11}}>Observações: {selected.notes||'Nenhuma observação.'}</p></div></Modal>}
 </>;
}
function ClientForm({initial,onClose,onSave}){
 const [values,setValues]=useState(initial||{name:'',phone:'',email:'',birth:'',visits:0,notes:''});const [error,setError]=useState('');
 const change=e=>setValues(p=>({...p,[e.target.name]:e.target.value}));
 return <Modal title={initial?'Editar cliente':'Novo cliente'} subtitle="Os dados ficam salvos neste navegador." onClose={onClose} footer={<><button className="btn secondary" onClick={onClose} data-testid="button-cancel-client">Cancelar</button><button form="client-form" className="btn" data-testid="button-save-client">Salvar cliente</button></>}>
 <form id="client-form" onSubmit={e=>{e.preventDefault();if(!values.name.trim()||!values.phone.trim()){setError('Informe o nome e o telefone para continuar.');return;}setError('');onSave(e.currentTarget);}}><div className="form-grid"><FormField label="Nome completo" name="name" value={values.name} onChange={change} required/><FormField label="Telefone" name="phone" value={values.phone} onChange={change} required placeholder="(11) 90000-0000"/><FormField label="E-mail" name="email" type="email" value={values.email} onChange={change}/><FormField label="Data de nascimento" name="birth" type="date" value={values.birth} onChange={change}/><FormField label="Observações" name="notes" value={values.notes} onChange={change} span placeholder="Preferências, cuidados ou notas importantes"/></div>{error&&<div style={{color:'#A55E5E',fontSize:11}} role="alert" data-testid="text-client-error">{error}</div>}</form>
 </Modal>;
}

function Services(){
 const {data,saveItem,removeItem,notify}=useApp();const [q,setQ]=useState('');const [open,setOpen]=useState(false);const [editing,setEditing]=useState(null);
 const filtered=data.services.filter(x=>x.name.toLowerCase().includes(q.toLowerCase()));
 const save=form=>{const f=new FormData(form);const item={id:editing?.id||Date.now(),name:f.get('name'),description:f.get('description'),duration:Number(f.get('duration')),price:Number(f.get('price')),status:f.get('status')};if(!item.name||!item.duration||item.price<0){notify('Revise os campos obrigatórios.',true);return;}saveItem('services',item);setOpen(false);notify(editing?'Procedimento atualizado.':'Procedimento cadastrado.');};
 const erase=s=>{if(window.confirm(`Excluir o procedimento “${s.name}”?`)){removeItem('services',s.id);notify('Procedimento removido.');}};
 return <><PageHeading eyebrow="Menu de cuidados" title="Serviços" subtitle="Procedimentos, duração e valores do seu espaço." action={<button className="btn" onClick={()=>{setEditing(null);setOpen(true)}} data-testid="button-new-service"><Plus/>Novo procedimento</button>}/>
 <div className="card panel"><div className="panel-head"><div><div className="panel-title">Procedimentos oferecidos</div><div className="panel-sub">{data.services.filter(s=>s.status==='Ativo').length} ativos · dados de demonstração</div></div><div className="search-box"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar procedimento..." aria-label="Buscar procedimento" data-testid="input-search-services"/></div></div>
 <div className="table-wrap"><table><thead><tr><th>Procedimento</th><th>Duração</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(s=><tr key={s.id} data-testid={`row-service-${s.id}`}><td><strong>{s.name}</strong><div className="muted" style={{fontSize:10,marginTop:4,maxWidth:430}}>{s.description}</div></td><td>{s.duration} min</td><td>{currency(s.price)}</td><td><span className={`status ${s.status==='Ativo'?'confirmada':'concluída'}`}>{s.status}</span></td><td><div className="table-actions"><button className="small-icon" aria-label={`Editar ${s.name}`} onClick={()=>{setEditing(s);setOpen(true)}} data-testid={`button-edit-service-${s.id}`}><Pencil/></button><button className="small-icon" aria-label={`Excluir ${s.name}`} onClick={()=>erase(s)} data-testid={`button-delete-service-${s.id}`}><Trash2/></button></div></td></tr>)}</tbody></table></div>
 {!filtered.length&&<Empty title={q?'Nenhum procedimento encontrado':'Nenhum procedimento cadastrado'} text={q?'Tente buscar por outro nome.':'Adicione os cuidados oferecidos pela clínica.'} icon={Sparkles}/>}
 </div>
 {open&&<ServiceForm initial={editing} onClose={()=>setOpen(false)} onSave={save}/>}</>;
}
function ServiceForm({initial,onClose,onSave}){
 const [v,setV]=useState(initial||{name:'',description:'',duration:60,price:'',status:'Ativo'});
 const change=e=>setV(p=>({...p,[e.target.name]:e.target.value}));
 return <Modal title={initial?'Editar procedimento':'Novo procedimento'} subtitle="Defina os detalhes exibidos à equipe e aos clientes." onClose={onClose} footer={<><button className="btn secondary" onClick={onClose} data-testid="button-cancel-service">Cancelar</button><button form="service-form" className="btn" data-testid="button-save-service">Salvar procedimento</button></>}>
 <form id="service-form" onSubmit={e=>{e.preventDefault();onSave(e.currentTarget)}}><div className="form-grid"><FormField label="Nome do procedimento" name="name" value={v.name} onChange={change} required span/><div className="field span-2"><label htmlFor="description">Descrição</label><textarea id="description" name="description" value={v.description} onChange={change} placeholder="Conte um pouco sobre esse cuidado..." data-testid="input-description"/></div><FormField label="Duração (minutos)" name="duration" type="number" min="5" value={v.duration} onChange={change} required/><FormField label="Valor (R$)" name="price" type="number" min="0" step="0.01" value={v.price} onChange={change} required/><FormField label="Status" name="status" value={v.status} onChange={change} options={['Ativo','Inativo']}/></div></form>
 </Modal>;
}

function Professionals(){
 const {data,saveItem,removeItem,notify}=useApp();const [open,setOpen]=useState(false);const [editing,setEditing]=useState(null);
 const save=form=>{const f=new FormData(form);const item={id:editing?.id||Date.now(),name:f.get('name'),role:f.get('role'),email:f.get('email'),phone:f.get('phone'),color:'#EBC5D2'};if(!item.name||!item.role){notify('Informe nome e especialidade.',true);return;}saveItem('professionals',item);setOpen(false);notify(editing?'Profissional atualizado.':'Profissional cadastrado.');};
 const erase=p=>{if(window.confirm(`Remover ${p.name} da equipe?`)){removeItem('professionals',p.id);notify('Profissional removido.');}};
 return <><PageHeading eyebrow="Quem cuida de cada detalhe" title="Profissionais" subtitle={`Equipe e especialidades da clínica ${CLINIC_NAME}.`} action={<button className="btn" onClick={()=>{setEditing(null);setOpen(true)}} data-testid="button-new-professional"><Plus/>Cadastrar profissional</button>}/>
 <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(265px,1fr))',gap:15}}>{data.professionals.map(p=><article className="card" key={p.id} style={{padding:22}} data-testid={`card-professional-${p.id}`}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div className="avatar" style={{height:52,width:52,fontSize:15,background:p.color}}>{p.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div><div className="table-actions"><button className="small-icon" aria-label={`Editar ${p.name}`} onClick={()=>{setEditing(p);setOpen(true)}} data-testid={`button-edit-professional-${p.id}`}><Pencil/></button><button className="small-icon" aria-label={`Remover ${p.name}`} onClick={()=>erase(p)} data-testid={`button-delete-professional-${p.id}`}><Trash2/></button></div></div><h3 className="serif" style={{fontSize:20,margin:'18px 0 4px'}}>{p.name}</h3><div style={{fontSize:11,color:'#A95777',fontWeight:600}}>{p.role}</div><div style={{borderTop:'1px solid #F4EEEE',marginTop:18,paddingTop:13,fontSize:11,color:'#93838A',display:'grid',gap:9}}><div style={{display:'flex',gap:8,alignItems:'center'}}><Mail size={14}/>{p.email}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><UserRound size={14}/>{p.phone}</div></div><div style={{fontSize:9,color:'#AE9DA3',marginTop:16}}>CADASTRO DE DEMONSTRAÇÃO</div></article>)}
 {!data.professionals.length&&<Empty title="Equipe ainda não cadastrada" text="Cadastre profissionais para organizar os atendimentos." icon={Stethoscope}/>}</div>
 {open&&<ProfessionalForm initial={editing} onClose={()=>setOpen(false)} onSave={save}/>}</>;
}
function ProfessionalForm({initial,onClose,onSave}){
 const [v,setV]=useState(initial||{name:'',role:'',email:'',phone:''});const change=e=>setV(p=>({...p,[e.target.name]:e.target.value}));
 return <Modal title={initial?'Editar profissional':'Cadastrar profissional'} subtitle="Informações fictícias para esta demonstração." onClose={onClose} footer={<><button className="btn secondary" onClick={onClose} data-testid="button-cancel-professional">Cancelar</button><button form="professional-form" className="btn" data-testid="button-save-professional">Salvar profissional</button></>}><form id="professional-form" onSubmit={e=>{e.preventDefault();onSave(e.currentTarget)}}><div className="form-grid"><FormField label="Nome completo" name="name" value={v.name} onChange={change} required/><FormField label="Especialidade" name="role" value={v.role} onChange={change} required/><FormField label="E-mail" name="email" type="email" value={v.email} onChange={change}/><FormField label="Telefone" name="phone" value={v.phone} onChange={change}/></div></form></Modal>;
}

function SettingsPage(){
 const {notify}=useApp();
 const [clinic,setClinic]=useState(()=>{const defaults={name:CLINIC_NAME,phone:'(11) 3021-8740',email:'contato@example.com',address:'Rua Harmonia, 418 · Vila Madalena, São Paulo'};try{const saved=JSON.parse(localStorage.getItem('atelier-clinic-settings'));if(!saved)return defaults;return {...defaults,...saved,name:saved.name==='Atelier Pele'||!saved.name?CLINIC_NAME:saved.name,email:saved.email==='contato@atelierpele.com'?'contato@example.com':saved.email||defaults.email};}catch{return defaults;}});
 const [hours,setHours]=useState(()=>{try{return JSON.parse(localStorage.getItem('atelier-business-hours'))||{seg:true,ter:true,qua:true,qui:true,sex:true,sab:true,dom:false};}catch{return {seg:true,ter:true,qua:true,qui:true,sex:true,sab:true,dom:false};}});
 useEffect(()=>localStorage.setItem('atelier-business-hours',JSON.stringify(hours)),[hours]);
 const saveClinic=e=>{e.preventDefault();localStorage.setItem('atelier-clinic-settings',JSON.stringify(clinic));notify('Dados da clínica salvos neste navegador.');};
 return <><PageHeading eyebrow="Preferências do espaço" title="Configurações" subtitle="Ajuste os dados e preferências da clínica."/>
 <div className="settings-list">
 <section className="card settings-card"><h3>Dados da clínica</h3><p>Informações de apresentação do seu espaço. Alterações ficam neste navegador.</p><form onSubmit={saveClinic}><div className="form-grid" style={{marginTop:17}}><FormField label="Nome da clínica" name="clinic-name" value={clinic.name} onChange={e=>setClinic({...clinic,name:e.target.value})} required/><FormField label="Telefone" name="clinic-phone" value={clinic.phone} onChange={e=>setClinic({...clinic,phone:e.target.value})}/><FormField label="E-mail" name="clinic-email" type="email" value={clinic.email} onChange={e=>setClinic({...clinic,email:e.target.value})}/><FormField label="Endereço" name="clinic-address" value={clinic.address} onChange={e=>setClinic({...clinic,address:e.target.value})}/></div><button className="btn" type="submit" data-testid="button-save-clinic-settings">Salvar dados</button></form></section>
 <section className="card settings-card"><h3>Horários de atendimento</h3><p>Defina os dias em que a clínica recebe clientes.</p>{Object.entries({seg:'Segunda-feira',ter:'Terça-feira',qua:'Quarta-feira',qui:'Quinta-feira',sex:'Sexta-feira',sab:'Sábado',dom:'Domingo'}).map(([key,label])=><div className="setting-row" key={key}><span style={{fontSize:12}}>{label}</span><input type="checkbox" className="toggle" checked={hours[key]} onChange={e=>setHours({...hours,[key]:e.target.checked})} aria-label={`${label} aberto`} data-testid={`toggle-hours-${key}`}/></div>)}</section>
 <section className="card settings-card"><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:15}}><div><h3>Google Calendar</h3><p>Sincronização de agenda indisponível nesta fase. Nenhuma conta está conectada.</p></div><div className="status pendente">Não configurado</div></div><div className="setting-row" style={{marginTop:15}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Link2Off size={17} color="#A9959D"/><span style={{fontSize:11,color:'#93838A'}}>Integração externa não ativa</span></div><button className="btn secondary" disabled style={{opacity:.58,cursor:'not-allowed'}} data-testid="button-calendar-integration-disabled">Indisponível nesta fase</button></div></section>
 <section className="card settings-card"><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:15}}><div><h3>Mensagens e lembretes</h3><p>Envios por WhatsApp ou e-mail não estão conectados. Nenhuma mensagem será enviada.</p></div><div className="status pendente">Não configurado</div></div><div className="setting-row" style={{marginTop:15}}><span style={{fontSize:11,color:'#93838A'}}>Lembretes automáticos</span><input type="checkbox" className="toggle" disabled aria-label="Lembretes automáticos não disponíveis" data-testid="toggle-reminders-disabled"/></div></section>
 <section className="card settings-card"><h3>Preferências do sistema</h3><p>Preferências locais desta experiência demonstrativa.</p><div className="setting-row"><div><div style={{fontSize:12,fontWeight:600}}>Dados de demonstração</div><div className="muted" style={{fontSize:10,marginTop:4}}>Os cadastros são armazenados apenas neste navegador.</div></div><ShieldCheck size={18} color="#C5A15A"/></div><div className="setting-row"><div><div style={{fontSize:12,fontWeight:600}}>Moeda</div><div className="muted" style={{fontSize:10,marginTop:4}}>Real brasileiro (BRL)</div></div><CreditCard size={18} color="#C5A15A"/></div></section>
 </div></>;
}

function PublicBooking(){
 const {data,setData}=useApp();const [step,setStep]=useState(1);const [booking,setBooking]=useState({service:'',professional:'',date:'',time:'',name:'',phone:'',email:''});const [complete,setComplete]=useState(false);const [error,setError]=useState('');
 const activeServices=data.services.filter(s=>s.status==='Ativo');const dates=Array.from({length:7},(_,i)=>datePlus(i));
 const chosenService=data.services.find(s=>s.name===booking.service);const update=(k,val)=>setBooking(p=>({...p,[k]:val}));
 const next=()=>{setError('');if(step===1&&!booking.service){setError('Escolha um procedimento para continuar.');return;}if(step===2&&!booking.professional){setError('Escolha um profissional para continuar.');return;}if(step===3&&(!booking.date||!booking.time)){setError('Escolha uma data e um horário.');return;}setStep(s=>Math.min(4,s+1));};
 const finish=()=>{if(!booking.name.trim()||!booking.phone.trim()||!booking.email.trim()){setError('Preencha nome, telefone e e-mail.');return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)){setError('Informe um e-mail válido.');return;}
   const found=data.clients.find(c=>c.name.toLowerCase()===booking.name.trim().toLowerCase());const client=found?found.name:booking.name.trim();
   const appointment={id:Date.now(),client,service:booking.service,professional:booking.professional,date:booking.date,time:booking.time,status:'Pendente',price:chosenService?.price||0};
   setData(p=>({...p,clients:found?p.clients:[{id:Date.now()+1,name:client,phone:booking.phone,email:booking.email,visits:0,lastVisit:'',notes:''},...p.clients],appointments:[appointment,...p.appointments]}));setComplete(true);setError('');
 };
 return <div className="public-page"><header className="public-nav"><NavLink to="/" className="brand" style={{padding:0,textDecoration:'none',color:'inherit'}} data-testid="link-public-brand"><div className="brand-mark"><Flower2 size={21}/></div><div><div className="brand-name">{CLINIC_NAME}</div><div className="brand-sub">gestão estética</div></div></NavLink><span style={{fontSize:10,color:'#A9959D'}}>Agendamento online · demonstração</span></header>
 <main className="public-content"><div className="public-title"><div className="eyebrow">Um tempo para você</div><h1 className="serif">Agende seu cuidado</h1><p>Escolha o tratamento, o melhor horário e venha viver esse momento.</p></div>
 <div className="booking-layout"><section className="card booking-card">
 {!complete&&<><div className="step-list">{['Procedimento','Profissional','Data e horário','Seus dados'].map((label,i)=><div key={label} className={`step-item ${step===i+1?'active':''}`}><span className="step-num">{i+1<step?<Check size={12}/>:i+1}</span><span>{label}</span></div>)}</div>
 {step===1&&<><h2 className="serif" style={{fontSize:20,margin:'0 0 5px'}}>O que você gostaria de fazer?</h2><p className="muted" style={{fontSize:11,margin:'0 0 17px'}}>Escolha um dos nossos procedimentos.</p><div className="choice-grid">{activeServices.map(s=><button className={`choice ${booking.service===s.name?'selected':''}`} key={s.id} onClick={()=>{update('service',s.name);update('professional','')}} data-testid={`button-book-service-${s.id}`}><strong>{s.name}</strong><span>{s.duration} min · {currency(s.price)}</span></button>)}</div></>}
 {step===2&&<><h2 className="serif" style={{fontSize:20,margin:'0 0 5px'}}>Com quem você prefere?</h2><p className="muted" style={{fontSize:11,margin:'0 0 17px'}}>Nossa equipe está pronta para receber você.</p><div className="choice-grid">{data.professionals.map(p=><button className={`choice ${booking.professional===p.name?'selected':''}`} key={p.id} onClick={()=>update('professional',p.name)} data-testid={`button-book-professional-${p.id}`}><strong>{p.name}</strong><span>{p.role}</span></button>)}</div></>}
 {step===3&&<><h2 className="serif" style={{fontSize:20,margin:'0 0 5px'}}>Encontre um bom momento</h2><p className="muted" style={{fontSize:11,margin:'0 0 17px'}}>Selecione uma data e um horário disponível.</p><div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:13}}>{dates.map(d=><button key={d} className={`choice ${booking.date===d?'selected':''}`} style={{minWidth:74,textAlign:'center'}} onClick={()=>{update('date',d);update('time','')}} data-testid={`button-book-date-${d}`}><span style={{marginTop:0,textTransform:'capitalize'}}>{new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'short'})}</span><strong style={{marginTop:4}}>{new Date(`${d}T12:00:00`).getDate()}</strong><span>{new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR',{month:'short'})}</span></button>)}</div><div className="time-grid">{['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'].map(t=><button className={`time-slot ${booking.time===t?'selected':''}`} key={t} onClick={()=>update('time',t)} data-testid={`button-book-time-${t.replace(':','-')}`}>{t}</button>)}</div></>}
 {step===4&&<><h2 className="serif" style={{fontSize:20,margin:'0 0 5px'}}>Só falta conhecer você</h2><p className="muted" style={{fontSize:11,margin:'0 0 18px'}}>Usaremos esses dados apenas para identificar sua reserva demonstrativa.</p><div className="form-grid"><FormField label="Nome completo" name="booking-name" value={booking.name} onChange={e=>update('name',e.target.value)} required/><FormField label="Telefone" name="booking-phone" value={booking.phone} onChange={e=>update('phone',e.target.value)} required placeholder="(11) 90000-0000"/><FormField label="E-mail" name="booking-email" type="email" value={booking.email} onChange={e=>update('email',e.target.value)} required span/></div></>}
 {error&&<div role="alert" style={{fontSize:11,color:'#A55E5E',marginTop:12}} data-testid="text-booking-error">{error}</div>}
 <div style={{display:'flex',justifyContent:'space-between',marginTop:25,borderTop:'1px solid #F3ECEC',paddingTop:16}}>{step>1?<button className="btn secondary" onClick={()=>{setStep(s=>s-1);setError('')}} data-testid="button-booking-back"><ArrowLeft size={15}/>Voltar</button>:<span/>}{step<4?<button className="btn" onClick={next} data-testid="button-booking-next">Continuar<ArrowRight size={15}/></button>:<button className="btn" onClick={finish} data-testid="button-booking-confirm">Solicitar agendamento<Check size={15}/></button>}</div>
 </>}
 {complete&&<div className="success-panel"><div className="success-mark"><CheckCircle2 size={29}/></div><div className="eyebrow">Pedido registrado na demonstração</div><h2>Seu momento está reservado</h2><p>Olá, {booking.name.split(' ')[0]}. Recebemos sua solicitação. Este é um agendamento de demonstração e não envia mensagens nem confirma disponibilidade externa.</p><div className="card" style={{boxShadow:'none',padding:15,textAlign:'left',margin:'22px auto',maxWidth:360}}><div className="summary-line"><span>Procedimento</span><strong>{booking.service}</strong></div><div className="summary-line"><span>Profissional</span><strong>{booking.professional}</strong></div><div className="summary-line"><span>Data e horário</span><strong>{fmtDate(booking.date,{day:'2-digit',month:'long'})} · {booking.time}</strong></div></div><button className="btn secondary" onClick={()=>{setComplete(false);setStep(1);setBooking({service:'',professional:'',date:'',time:'',name:'',phone:'',email:''})}} data-testid="button-book-again">Fazer novo agendamento</button></div>}
 </section>
 <aside className="card summary-card"><div className="eyebrow">Sua seleção</div><h3>Resumo do cuidado</h3><div className="summary-line"><span>Procedimento</span><strong>{booking.service||'A escolher'}</strong></div>{chosenService&&<div className="summary-line"><span>Duração</span><strong>{chosenService.duration} min</strong></div>}<div className="summary-line"><span>Profissional</span><strong>{booking.professional||'A escolher'}</strong></div><div className="summary-line"><span>Data</span><strong>{booking.date?fmtDate(booking.date,{day:'2-digit',month:'long'}):'A escolher'}</strong></div><div className="summary-line"><span>Horário</span><strong>{booking.time||'—'}</strong></div><div className="summary-line" style={{borderTop:'1px solid #E8DDE0',marginTop:3,paddingTop:15}}><span>Valor</span><strong style={{color:'#A95777',fontSize:14}}>{chosenService?currency(chosenService.price):'—'}</strong></div><p style={{fontSize:9,color:'#A9959D',lineHeight:1.6,marginTop:13}}>Demonstração de interface. Sua solicitação não se conecta à clínica nem dispara confirmações.</p></aside>
 </div></main></div>;
}

function NotFound(){return <div className="empty-state" style={{paddingTop:'18vh'}}><div className="empty-icon"><Flower2/></div><h3>Página não encontrada</h3><p>Esse endereço não faz parte da experiência demonstrativa.</p><NavLink className="btn" to="/" data-testid="link-back-home">Voltar ao início</NavLink></div>}

export default App;
