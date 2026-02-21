import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Constants ────────────────────────────────────────────────────────────────
const DOLPHIN_URL = "https://cdn.poehali.dev/projects/dd998167-bb93-472a-9cea-24032a9ccac4/files/cd1e4089-fff7-4e64-848a-9f6163ba51aa.jpg";
const SECRET_PROMO = "ADMINMENULOGIN123";
const MAX_SERVERS = 5;

function randPort() { return Math.floor(10000 + Math.random() * 89999); }
function randId() { return Math.random().toString(36).slice(2, 10); }
function maskPass(p: string) { return "•".repeat(Math.max(8, p.length)); }

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "home" | "auth" | "panel" | "profile";
type AuthMode = "login" | "register";
type ServiceTab = "game" | "vds" | "web";
type PanelTab = "console" | "files" | "settings" | "db" | "subdomains" | "co-owners";
type ServerStatus = "offline" | "starting" | "online" | "stopping";
type PayMethod = "card" | "sbp" | "sber" | "sberkids";

interface PlanAny { id: string; price: number; cpu: string; ram: string; disk: string; net: string; [k: string]: string | number; }
interface ServerFile { name: string; type: "file" | "folder"; size?: string; ext?: string; }
interface ServerInfo { plan: PlanAny; port: number; id: string; status: ServerStatus; }
interface AdminLog { time: string; msg: string; type: "info" | "warn" | "purchase"; purchaseId?: string; purchasePlan?: PlanAny; }
interface CoOwner { email: string; addedAt: string; }
interface Subdomain { name: string; target: string; created: string; }
interface DbRecord { table: string; rows: number; size: string; }
interface UserState { name: string; email: string; password: string; balance: number; isAdmin: boolean; servers: ServerInfo[]; }

// ─── Plan Data ────────────────────────────────────────────────────────────────
const gamePlans: PlanAny[] = [
  { id: "GAME RU-1", price: 245, cpu: "2 vCPU (Intel Core i5-12500)", ram: "4 GB DDR5", disk: "24 GB NVMe", net: "1 Гбит/с", backups: 0, db: 1 },
  { id: "GAME RU-2", price: 366, cpu: "3 vCPU (Intel Core i5-12500)", ram: "6 GB DDR5", disk: "32 GB NVMe", net: "1 Гбит/с", backups: 1, db: 1 },
  { id: "GAME RU-3", price: 510, cpu: "4 vCPU (Intel Core i5-12500)", ram: "8 GB DDR5", disk: "48 GB NVMe", net: "1 Гбит/с", backups: 2, db: 2 },
  { id: "GAME RU-4", price: 767, cpu: "6 vCPU (Intel Core i5-12500)", ram: "12 GB DDR5", disk: "56 GB NVMe", net: "1 Гбит/с", backups: 2, db: 2 },
  { id: "GAME RU-5", price: 1027, cpu: "8 vCPU (Intel Core i5-12500)", ram: "16 GB DDR5", disk: "72 GB NVMe", net: "1 Гбит/с", backups: 3, db: 3 },
];
const vdsPlans: PlanAny[] = [
  { id: "VDS DE-1", price: 249, cpu: "1 vCPU (AMD Ryzen 9 5950X)", ram: "2 GB", disk: "24 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7" },
  { id: "VDS DE-2", price: 529, cpu: "2 vCPU (AMD Ryzen 9 5950X)", ram: "4 GB", disk: "48 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7" },
  { id: "VDS DE-3", price: 949, cpu: "4 vCPU (AMD Ryzen 9 5950X)", ram: "8 GB", disk: "96 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7" },
  { id: "VDS DE-4", price: 1649, cpu: "8 vCPU (AMD Ryzen 9 5950X)", ram: "16 GB", disk: "192 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7" },
  { id: "VDS DE-5", price: 2899, cpu: "12 vCPU (AMD Ryzen 9 5950X)", ram: "32 GB", disk: "384 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7" },
];

const PLAN_IMAGES: Record<string, string> = {
  "GAME RU-1": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  "GAME RU-2": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80",
  "GAME RU-3": "https://images.unsplash.com/photo-1606868306217-dbf5046868d2?w=600&q=80",
  "GAME RU-4": "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=600&q=80",
  "GAME RU-5": "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=600&q=80",
  "VDS DE-1": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  "VDS DE-2": "https://images.unsplash.com/photo-1520869562399-e772f042f422?w=600&q=80",
  "VDS DE-3": "https://images.unsplash.com/photo-1545987796-200677ee1011?w=600&q=80",
  "VDS DE-4": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  "VDS DE-5": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&q=80",
};

const startupMessages = [
  "[Server thread/INFO]: Starting minecraft server version 1.20.4",
  "[Server thread/INFO]: Loading properties",
  "[Server thread/INFO]: Default game type: SURVIVAL",
  "[Server thread/INFO]: Generating keypair",
  "[Server thread/INFO]: Starting Minecraft server on *:PORT",
  "[Server thread/INFO]: Using epoll channel type",
  "[Server thread/INFO]: Preparing level \"world\"",
  "[Server thread/INFO]: Preparing spawn area: 0%",
  "[Server thread/INFO]: Preparing spawn area: 48%",
  "[Server thread/INFO]: Preparing spawn area: 95%",
  "[Server thread/INFO]: Done (6.234s)! For help, type \"help\"",
  "[RCON Listener/INFO]: RCON running on 0.0.0.0:25575",
];

const defaultFiles: ServerFile[] = [
  { name: "server.jar", type: "file", size: "42.3 MB", ext: "jar" },
  { name: "server.properties", type: "file", size: "3.1 KB", ext: "properties" },
  { name: "plugins", type: "folder" },
  { name: "world", type: "folder" },
  { name: "eula.txt", type: "file", size: "0.2 KB", ext: "txt" },
  { name: "logs", type: "folder" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCard(v: string) { return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
function nowStr() { return new Date().toLocaleTimeString("ru-RU"); }

// ─── Admin Log Store ──────────────────────────────────────────────────────────
const adminLogs: AdminLog[] = [
  { time: nowStr(), msg: "Система ZetixHost запущена", type: "info" },
  { time: nowStr(), msg: "Подключение к базе данных установлено", type: "info" },
];
let adminLogListeners: (() => void)[] = [];
function pushAdminLog(log: AdminLog) {
  adminLogs.unshift(log);
  if (adminLogs.length > 200) adminLogs.pop();
  adminLogListeners.forEach(fn => fn());
}
function useAdminLogs() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    adminLogListeners.push(fn);
    return () => { adminLogListeners = adminLogListeners.filter(f => f !== fn); };
  }, []);
  return adminLogs;
}

// ─── Monitoring Hook ──────────────────────────────────────────────────────────
function useMonitoring(status: ServerStatus) {
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);
  const [net, setNet] = useState(0);
  const [players, setPlayers] = useState(0);
  useEffect(() => {
    if (status !== "online") { setCpu(0); setRam(0); setNet(0); setPlayers(0); return; }
    const iv = setInterval(() => {
      setCpu(Math.round(15 + Math.random() * 60));
      setRam(Math.round(20 + Math.random() * 55));
      setNet(Math.round(Math.random() * 40));
      setPlayers(p => Math.max(0, Math.min(20, p + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
    }, 1500);
    return () => clearInterval(iv);
  }, [status]);
  return { cpu, ram, net, players };
}

function MiniBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs" style={{ color: "var(--z-muted)" }}>
        <span>{label}</span><span style={{ color }}>{val}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--z-card2)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: color }} />
      </div>
    </div>
  );
}

function SpecRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon name={icon} fallback="Circle" size={13} className="mt-0.5 shrink-0" style={{ color: "var(--z-muted)" }} />
      <div>
        <div style={{ color: "var(--z-muted)" }}>{label}</div>
        <div className="text-white font-medium">{value}</div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onAuthClick, onPanelClick, onProfileClick, loggedIn, user }: {
  onAuthClick: () => void; onPanelClick: () => void; onProfileClick: () => void; loggedIn: boolean; user?: UserState;
}) {
  return (
    <nav style={{ background: "rgba(12,13,16,0.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--z-border)" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 8, width: 32, height: 32 }}
          className="flex items-center justify-center font-bold text-white text-sm">Z</div>
        <span className="font-bold text-white text-lg">ZetixHost</span>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--z-muted)" }}>
        <a href="#services" className="hover:text-white transition-colors">Услуги</a>
        <a href="#plans" className="hover:text-white transition-colors">Тарифы</a>
        <a href="#advantages" className="hover:text-white transition-colors">Преимущества</a>
        {loggedIn && <button onClick={onPanelClick} className="hover:text-white transition-colors" style={{ color: "var(--z-blue)" }}>Мои серверы</button>}
      </div>
      {loggedIn && user ? (
        <div className="flex items-center gap-2">
          <button onClick={onProfileClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)" }}>
              {user.name[0]?.toUpperCase()}
            </div>
            <span className="text-white text-xs">{user.name}</span>
            {user.isAdmin && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                style={{ background: "rgba(0,180,255,0.15)", color: "var(--z-blue)" }}>
                <Icon name="BadgeCheck" size={10} /> Админ
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--z-muted)" }}>{user.balance.toLocaleString("ru-RU")}₽</span>
          </button>
          <button onClick={onPanelClick} className="z-btn-primary px-4 py-2 text-sm">
            <Icon name="LayoutDashboard" size={13} /> Панель
          </button>
        </div>
      ) : (
        <button onClick={onAuthClick} className="z-btn-primary px-5 py-2 text-sm">Войти</button>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onOrderClick }: { onOrderClick: () => void }) {
  return (
    <section className="min-h-screen flex items-center px-6 pt-20" style={{ background: "var(--z-bg)" }}>
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xl mb-2 font-medium" style={{ color: "var(--z-muted)" }}>Надежный</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            Хостинг, где<br />ваши идеи<br />обретают<br />жизнь
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--z-muted)" }}>
            Создавайте проекты и достигайте<br />недостижимого вместе с нами
          </p>
          <button onClick={onOrderClick} className="z-btn-primary px-7 py-3.5 text-base">→ Заказать</button>
        </div>
        <div className="flex justify-center items-center">
          <img src={DOLPHIN_URL} alt="ZetixHost Dolphin" className="w-72 md:w-96 object-contain"
            style={{ filter: "drop-shadow(0 0 60px rgba(0,180,255,0.45))" }} />
        </div>
      </div>
    </section>
  );
}

// ─── Advantages ───────────────────────────────────────────────────────────────
function AdvantagesSection() {
  const items = [
    { icon: "ShieldCheck", title: "Надёжная защита", desc: "Все атаки нейтрализуются ещё до того, как коснутся вашего сервера." },
    { icon: "Zap", title: "Молниеносная скорость", desc: "Сервера и сеть работают без тормозов, даже при больших нагрузках." },
    { icon: "Clock", title: "Работа 24/7", desc: "Ваш проект в сети всегда онлайн — без пауз и перерывов." },
    { icon: "CreditCard", title: "Тариф под любой проект", desc: "Выбирайте план, который идеально подходит под ваш бюджет и задачи." },
    { icon: "MousePointerClick", title: "Управление в один клик", desc: "Простая панель, где вы контролируете всё без лишних сложностей." },
    { icon: "Phone", title: "Всегда на связи", desc: "Наша команда поддержки готова помочь в любой момент." },
  ];
  return (
    <section id="advantages" className="py-20 px-6" style={{ background: "var(--z-bg)" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-2">Наши преимущества</h2>
        <p className="text-center mb-12" style={{ color: "var(--z-muted)" }}>Почему стоит выбрать нас</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.title} className="p-6 rounded-2xl transition-all hover:border-white/20"
              style={{ background: "#111214", border: "1px solid #222428" }}>
              <div className="flex items-center gap-3 mb-4">
                <Icon name={item.icon} fallback="Circle" size={22} className="text-white" />
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "#888" }}>{item.desc}</p>
              <button className="flex items-center gap-1 text-sm font-medium text-white hover:opacity-70 transition-opacity">подробнее →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onBuy }: { plan: PlanAny; onBuy: (p: PlanAny) => void }) {
  const img = PLAN_IMAGES[plan.id];
  const isVds = plan.id.startsWith("VDS");
  return (
    <div className="z-card flex flex-col hover:border-blue-500/40 transition-all overflow-hidden">
      <div className="relative h-36 overflow-hidden">
        <img src={img} alt={plan.id} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, var(--z-card) 100%)" }} />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
            {isVds ? "🇩🇪 Германия" : "🇷🇺 Россия"}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <Icon name={isVds ? "Server" : "Gamepad2"} fallback="Server" size={16} style={{ color: "var(--z-blue)" }} />
        </div>
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">{plan.id}</span>
          <div>
            <span className="text-xl font-bold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽</span>
            <span className="text-xs ml-1" style={{ color: "var(--z-muted)" }}>/мес.</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <SpecRow icon="Cpu" label="CPU" value={plan.cpu as string} />
          <SpecRow icon="MemoryStick" label="RAM" value={plan.ram as string} />
          <SpecRow icon="HardDrive" label="Диск" value={plan.disk as string} />
          <SpecRow icon="Wifi" label="Сеть" value={plan.net as string} />
          {isVds && plan.ddos && <SpecRow icon="Shield" label="DDoS" value={plan.ddos as string} />}
          {!isVds && <SpecRow icon="RefreshCw" label="Бэкапы" value={String(plan.backups)} />}
        </div>
        <button onClick={() => onBuy(plan)} className="z-btn-primary w-full py-2.5 justify-center text-sm mt-auto">
          <Icon name="ShoppingCart" size={13} /> Купить →
        </button>
      </div>
    </div>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
function ServicesSection({ onBuy }: { onBuy: (p: PlanAny) => void }) {
  const [tab, setTab] = useState<ServiceTab>("game");
  const tabs = [
    { key: "game" as ServiceTab, icon: "Gamepad2", label: "Игровые серверы" },
    { key: "vds" as ServiceTab, icon: "Server", label: "Виртуальные серверы" },
    { key: "web" as ServiceTab, icon: "Globe", label: "Веб серверы" },
  ];
  const plans = tab === "game" ? gamePlans : tab === "vds" ? vdsPlans : [];
  return (
    <section id="services" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-2">Наши сервисы</h2>
        <p className="text-center mb-10" style={{ color: "var(--z-blue)" }}>Выберите подходящий тариф</p>
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={tab === t.key
                ? { background: "var(--z-card2)", border: "1px solid var(--z-border)", color: "white" }
                : { color: "var(--z-muted)", border: "1px solid transparent" }}>
              <Icon name={t.icon} fallback="Circle" size={13} />{t.label}
            </button>
          ))}
        </div>
        {tab === "web" ? (
          <div className="text-center py-20" style={{ color: "var(--z-muted)" }}>
            <Icon name="Globe" size={48} className="mx-auto mb-4 opacity-20" />
            <p>Веб-серверы скоро появятся</p>
          </div>
        ) : (
          <div id="plans" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(p => <PlanCard key={p.id} plan={p} onBuy={onBuy} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Buy Modal ────────────────────────────────────────────────────────────────
function BuyModal({ plan, user, onClose, onPending }: {
  plan: PlanAny; user: UserState; onClose: () => void; onPending: (id: string) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("card");
  const [card, setCard] = useState(""); const [cardName, setCardName] = useState(""); const [expiry, setExpiry] = useState(""); const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "pending">("form");
  const [purchaseId] = useState(() => randId());

  const handleExpiry = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); setExpiry(d.length > 2 ? d.slice(0,2)+"/"+d.slice(2) : d); };

  const submitPayment = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep("pending");
    pushAdminLog({ time: nowStr(), msg: `Новая покупка от ${user.email}: тариф ${plan.id} — ${plan.price}₽`, type: "purchase", purchaseId, purchasePlan: plan });
    onPending(purchaseId);
  };

  const payMethods: { key: PayMethod; label: string; icon: string }[] = [
    { key: "card", label: "Банковская карта", icon: "CreditCard" },
    { key: "sbp", label: "СБП", icon: "Smartphone" },
    { key: "sber", label: "Сбербанк", icon: "Building" },
    { key: "sberkids", label: "СберКидс", icon: "Star" },
  ];

  if (step === "pending") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
        <div className="z-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center animate-pulse"
            style={{ background: "rgba(245,158,11,0.15)", border: "2px solid #f59e0b" }}>
            <Icon name="Clock" size={28} style={{ color: "#f59e0b" }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ожидание подтверждения</h3>
          <p className="text-sm mb-4" style={{ color: "var(--z-muted)" }}>
            Заявка отправлена администратору. После подтверждения сервер будет активирован автоматически.
          </p>
          <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p style={{ color: "#f59e0b" }}>ID заявки: <span className="font-mono">{purchaseId}</span></p>
            <p className="mt-1" style={{ color: "var(--z-muted)" }}>Тариф: <span className="text-white">{plan.id}</span></p>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--z-muted)" }}>Реквизиты: 📞 +7 921 700-61-74 | 💳 2202 2082 8801 8451</p>
          <button onClick={onClose} className="z-btn-outline px-6 py-2 text-sm w-full justify-center">Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
      <div className="z-card p-7 max-w-md w-full" style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-white">Оплата тарифа</h3>
            <p className="text-sm" style={{ color: "var(--z-blue)" }}>{plan.id} — {(plan.price as number).toLocaleString("ru-RU")}₽/мес.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
            <Icon name="X" size={15} style={{ color: "var(--z-muted)" }} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {payMethods.map(m => (
            <button key={m.key} onClick={() => setMethod(m.key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={method === m.key
                ? { background: "rgba(0,180,255,0.12)", border: "1px solid rgba(0,180,255,0.3)", color: "var(--z-blue)" }
                : { background: "var(--z-card2)", border: "1px solid var(--z-border)", color: "var(--z-muted)" }}>
              <Icon name={m.icon} fallback="Circle" size={13} />{m.label}
            </button>
          ))}
        </div>
        {method !== "card" ? (
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(0,180,255,0.06)", border: "1px solid rgba(0,180,255,0.15)" }}>
            <p className="font-semibold text-white mb-2">{method === "sbp" ? "Оплата по СБП" : method === "sber" ? "Оплата Сбербанк" : "Оплата СберКидс"}</p>
            <p style={{ color: "var(--z-muted)" }}>{method === "sbp" ? "📱 СБП на номер:" : "🏦 Перевод на карту:"}<br />
              <span className="text-white font-mono">{method === "sbp" ? "+7 921 700-61-74" : "2202 2082 8801 8451"}</span>
            </p>
            <p className="mt-2" style={{ color: "var(--z-muted)" }}>Сумма: <span className="text-white font-bold">{(plan.price as number).toLocaleString("ru-RU")}₽</span></p>
            <button onClick={submitPayment} disabled={loading} className="z-btn-primary w-full py-3 justify-center text-sm mt-4">
              {loading ? <><Icon name="Loader2" size={14} className="animate-spin" /> Обработка...</> : "Оплатил, жду подтверждения"}
            </button>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); submitPayment(); }} className="flex flex-col gap-4">
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#1a2040,#0d1230)", border: "1px solid rgba(0,180,255,0.2)" }}>
              <div className="flex justify-between items-start mb-5">
                <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 6, width: 28, height: 28 }}
                  className="flex items-center justify-center font-bold text-white text-xs">Z</div>
                <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>VISA / MC</span>
              </div>
              <p className="font-mono text-xl text-white tracking-widest mb-4">{card || "•••• •••• •••• ••••"}</p>
              <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="uppercase">{cardName || "ВЛАДЕЛЕЦ"}</span>
                <span>{expiry || "MM/YY"}</span>
              </div>
            </div>
            <input className="z-input font-mono tracking-widest" placeholder="Номер карты" value={card} onChange={e => setCard(formatCard(e.target.value))} required maxLength={19} />
            <input className="z-input uppercase" placeholder="Имя владельца" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} required />
            <div className="grid grid-cols-2 gap-3">
              <input className="z-input" placeholder="MM/YY" value={expiry} onChange={e => handleExpiry(e.target.value)} required maxLength={5} />
              <input className="z-input" placeholder="CVV" type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} required maxLength={3} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--z-border)" }}>
              <span style={{ color: "var(--z-muted)" }}>Итого:</span>
              <span className="text-xl font-bold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽</span>
            </div>
            <button type="submit" disabled={loading} className="z-btn-primary w-full py-3.5 justify-center text-sm">
              {loading ? <><Icon name="Loader2" size={14} className="animate-spin" /> Обработка...</> : <><Icon name="CreditCard" size={14} /> Оплатить</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Admin Logs Panel ─────────────────────────────────────────────────────────
function AdminLogsPanel({ onConfirmPurchase }: { onConfirmPurchase: (id: string, plan: PlanAny) => void }) {
  const logs = useAdminLogs();
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const handleConfirm = (log: AdminLog) => {
    if (!log.purchaseId || !log.purchasePlan) return;
    setConfirmed(prev => new Set([...prev, log.purchaseId!]));
    onConfirmPurchase(log.purchaseId!, log.purchasePlan!);
    pushAdminLog({ time: nowStr(), msg: `✅ Покупка ${log.purchaseId} подтверждена — сервер активирован`, type: "info" });
  };

  return (
    <div className="z-card mt-6 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
        <h4 className="font-bold text-white text-sm">Логи системы (реальное время)</h4>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Live</span>
      </div>
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg"
            style={{ background: log.type === "purchase" ? "rgba(245,158,11,0.06)" : "var(--z-card2)", border: `1px solid ${log.type === "purchase" ? "rgba(245,158,11,0.2)" : "var(--z-border)"}` }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: "var(--z-muted)" }}>{log.time}</span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: log.type === "purchase" ? "#f59e0b" : "#22c55e" }} />
              <span className="text-sm" style={{ color: log.type === "purchase" ? "#fbbf24" : "var(--z-text)" }}>{log.msg}</span>
            </div>
            {log.type === "purchase" && log.purchaseId && !confirmed.has(log.purchaseId) && (
              <button onClick={() => handleConfirm(log)}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                <Icon name="CheckCircle" size={12} /> Подтвердить покупку
              </button>
            )}
            {log.type === "purchase" && log.purchaseId && confirmed.has(log.purchaseId) && (
              <span className="text-xs" style={{ color: "#22c55e" }}>✓ Подтверждено</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, setUser, onBack, onConfirmPurchase }: {
  user: UserState; setUser: (u: UserState) => void; onBack: () => void; onConfirmPurchase: (id: string, plan: PlanAny) => void;
}) {
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<"" | "success" | "error">("");
  const [showPass, setShowPass] = useState(false);
  const [depositAmt, setDepositAmt] = useState("");
  const [depositMethod, setDepositMethod] = useState<PayMethod>("card");
  const [depositStep, setDepositStep] = useState<"form" | "pending" | "done">("form");

  const handlePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promo.trim() === SECRET_PROMO) {
      setUser({ ...user, isAdmin: true });
      setPromoMsg("success");
      pushAdminLog({ time: nowStr(), msg: `${user.email} активировал промокод администратора`, type: "info" });
    } else {
      setPromoMsg("error");
    }
    setPromo("");
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(depositAmt);
    if (!amt || amt < 1) return;
    setDepositStep("pending");
    pushAdminLog({ time: nowStr(), msg: `Пополнение баланса от ${user.email}: +${amt}₽ (${depositMethod})`, type: "purchase" });
    await new Promise(r => setTimeout(r, 1000));
    setDepositStep("done");
    setUser({ ...user, balance: user.balance + amt });
    setDepositAmt("");
  };

  const payMethods: { key: PayMethod; label: string }[] = [
    { key: "card", label: "Карта" }, { key: "sbp", label: "СБП" },
    { key: "sber", label: "Сбербанк" }, { key: "sberkids", label: "СберКидс" },
  ];

  return (
    <div className="min-h-screen pt-20 px-6 pb-12" style={{ background: "var(--z-bg)" }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm hover:text-white transition-colors" style={{ color: "var(--z-muted)" }}>
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Профиль</h2>

        {/* User card */}
        <div className="z-card p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl"
              style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)" }}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-white">{user.name}</p>
                {user.isAdmin && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(0,180,255,0.15)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.3)" }}>
                    <Icon name="BadgeCheck" size={11} /> Администратор
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: "var(--z-muted)" }}>Аккаунт ZetixHost</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {[
              { icon: "Mail", label: "Почта", value: user.email, action: null },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                <div className="flex items-center gap-2">
                  <Icon name={r.icon} fallback="Circle" size={13} style={{ color: "var(--z-muted)" }} />
                  <span style={{ color: "var(--z-muted)" }}>{r.label}</span>
                </div>
                <span className="text-white">{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Lock" size={13} style={{ color: "var(--z-muted)" }} />
                <span style={{ color: "var(--z-muted)" }}>Пароль</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white text-sm">{showPass ? user.password : maskPass(user.password)}</span>
                <button onClick={() => setShowPass(!showPass)} className="p-1 rounded hover:bg-white/10">
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={12} style={{ color: "var(--z-muted)" }} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Wallet" size={13} style={{ color: "var(--z-muted)" }} />
                <span style={{ color: "var(--z-muted)" }}>Баланс</span>
              </div>
              <span className="font-bold text-xl text-white">{user.balance.toLocaleString("ru-RU")}₽</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Server" size={13} style={{ color: "var(--z-muted)" }} />
                <span style={{ color: "var(--z-muted)" }}>Серверов</span>
              </div>
              <span className="text-white">{user.servers.length} / {MAX_SERVERS}</span>
            </div>
          </div>
        </div>

        {/* Deposit */}
        <div className="z-card p-6 mb-4">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="PlusCircle" size={15} style={{ color: "var(--z-blue)" }} /> Пополнить баланс
          </h3>
          {depositStep === "done" ? (
            <div className="text-center py-5">
              <Icon name="CheckCircle" size={36} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
              <p className="text-white font-semibold">Баланс пополнен!</p>
              <button onClick={() => setDepositStep("form")} className="mt-3 text-sm" style={{ color: "var(--z-blue)" }}>Пополнить ещё</button>
            </div>
          ) : depositStep === "pending" ? (
            <div className="text-center py-5">
              <Icon name="Clock" size={36} className="mx-auto mb-3 animate-pulse" style={{ color: "#f59e0b" }} />
              <p className="text-white font-semibold">Обрабатываем платёж...</p>
            </div>
          ) : (
            <form onSubmit={handleDeposit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {payMethods.map(m => (
                  <button type="button" key={m.key} onClick={() => setDepositMethod(m.key)}
                    className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                    style={depositMethod === m.key
                      ? { background: "rgba(0,180,255,0.12)", border: "1px solid rgba(0,180,255,0.3)", color: "var(--z-blue)" }
                      : { background: "var(--z-card2)", border: "1px solid var(--z-border)", color: "var(--z-muted)" }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <input className="z-input" type="number" min="1" placeholder="Сумма в рублях" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} required />
              <button type="submit" className="z-btn-primary py-2.5 justify-center text-sm">
                <Icon name="PlusCircle" size={13} /> Пополнить
              </button>
            </form>
          )}
        </div>

        {/* Promo */}
        <div className="z-card p-6 mb-4">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="Tag" size={15} style={{ color: "var(--z-blue)" }} /> Промокод
          </h3>
          {user.isAdmin ? (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(0,180,255,0.06)", border: "1px solid rgba(0,180,255,0.2)" }}>
              <Icon name="BadgeCheck" size={15} style={{ color: "var(--z-blue)" }} />
              <span className="text-sm" style={{ color: "var(--z-blue)" }}>Промокод активирован — выдан статус администратора</span>
            </div>
          ) : (
            <form onSubmit={handlePromo} className="flex gap-2">
              <input className="z-input flex-1" placeholder="Введите промокод" value={promo}
                onChange={e => { setPromo(e.target.value); setPromoMsg(""); }} />
              <button type="submit" className="z-btn-primary px-4 py-2 text-sm">Применить</button>
            </form>
          )}
          {promoMsg === "error" && <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>Неверный промокод</p>}
        </div>

        {/* Admin logs */}
        {user.isAdmin && <AdminLogsPanel onConfirmPurchase={onConfirmPurchase} />}
      </div>
    </div>
  );
}

// ─── Server Panel ─────────────────────────────────────────────────────────────
function ServerPanel({ server, user, setUser, onBack }: {
  server: ServerInfo; user: UserState; setUser: (u: UserState) => void; onBack: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>("console");
  const [status, setStatus] = useState<ServerStatus>(server.status);
  const [logs, setLogs] = useState<string[]>(["[ZetixHost] Сервер остановлен. Нажмите Старт."]);
  const [cmd, setCmd] = useState("");
  const [files, setFiles] = useState<ServerFile[]>(defaultFiles);
  const [selectedFile, setSelectedFile] = useState<ServerFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const msgIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { cpu, ram, net, players } = useMonitoring(status);

  const dbRecords: DbRecord[] = [
    { table: "players", rows: 142, size: "2.4 MB" },
    { table: "worlds", rows: 3, size: "1.1 GB" },
    { table: "plugins", rows: 18, size: "842 KB" },
    { table: "bans", rows: 7, size: "12 KB" },
  ];

  const [subdomains, setSubdomains] = useState<Subdomain[]>([
    { name: `${server.id}.msk.zetixhost.me`, target: `msk.zetixhost.me:${server.port}`, created: "2024-01-15" }
  ]);
  const [newSub, setNewSub] = useState("");
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [ownerMsg, setOwnerMsg] = useState("");

  useEffect(() => { consoleEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const addLog = useCallback((msg: string) => setLogs(p => [...p, msg]), []);

  const startServer = useCallback(() => {
    if (status !== "offline") return;
    setStatus("starting");
    msgIdxRef.current = 0;
    addLog("[ZetixHost] Запуск сервера...");
    timerRef.current = setInterval(() => {
      if (msgIdxRef.current < startupMessages.length) {
        addLog(startupMessages[msgIdxRef.current].replace("PORT", String(server.port)));
        msgIdxRef.current++;
      } else {
        setStatus("online");
        addLog(`[ZetixHost] Сервер запущен на порту ${server.port}`);
        if (timerRef.current) clearInterval(timerRef.current);
        setUser({ ...user, servers: user.servers.map(s => s.id === server.id ? { ...s, status: "online" } : s) });
      }
    }, 160);
  }, [status, addLog, server.port, server.id, user, setUser]);

  const stopServer = useCallback(() => {
    if (status !== "online") return;
    setStatus("stopping");
    addLog("[Server thread/INFO]: Stopping the server");
    setTimeout(() => { addLog("[ZetixHost] Сервер остановлен."); setStatus("offline"); }, 1500);
  }, [status, addLog]);

  const sendCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    addLog(`> ${cmd}`);
    if (cmd === "help") addLog("[INFO]: Commands: help, list, stop, say <msg>");
    else if (cmd === "list") addLog(`[INFO]: ${players}/20 игроков`);
    else if (cmd.startsWith("say ")) addLog(`[INFO]: [Server] ${cmd.slice(4)}`);
    else addLog(`[INFO]: Unknown command.`);
    setCmd("");
  };

  const sColors: Record<ServerStatus, string> = { offline: "#ef4444", starting: "#f59e0b", online: "#22c55e", stopping: "#f59e0b" };
  const sLabels: Record<ServerStatus, string> = { offline: "Остановлен", starting: "Запускается...", online: "Работает", stopping: "Останавливается..." };

  const sideItems = [
    { key: "console" as PanelTab, icon: "Terminal", label: "Консоль" },
    { key: "files" as PanelTab, icon: "FolderOpen", label: "Файлы" },
    { key: "db" as PanelTab, icon: "Database", label: "База данных" },
    { key: "subdomains" as PanelTab, icon: "Globe", label: "Субдомены" },
    { key: "co-owners" as PanelTab, icon: "Users", label: "Совладельцы" },
    { key: "settings" as PanelTab, icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--z-bg)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm hover:text-white transition-colors" style={{ color: "var(--z-muted)" }}>
            <Icon name="ArrowLeft" size={13} /> Назад
          </button>
          <span style={{ color: "var(--z-border)" }}>|</span>
          <span className="font-bold text-white text-sm">{server.plan.id}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--z-card2)", color: "var(--z-muted)" }}>:{server.port}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: sColors[status], boxShadow: `0 0 5px ${sColors[status]}` }} />
            <span style={{ color: "var(--z-muted)" }}>{sLabels[status]}</span>
          </div>
          {status === "online" && (
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span style={{ color: "#22c55e" }}>CPU {cpu}%</span>
              <span style={{ color: "#00b4ff" }}>RAM {ram}%</span>
              <span style={{ color: "#a78bfa" }}>👥{players}</span>
            </div>
          )}
          <div className="flex gap-1.5">
            <button onClick={startServer} disabled={status !== "offline"}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              style={status === "offline" ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" } : { opacity: 0.4, background: "var(--z-card2)", color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
              <Icon name="Play" size={11} /> Старт
            </button>
            <button onClick={stopServer} disabled={status !== "online"}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              style={status === "online" ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" } : { opacity: 0.4, background: "var(--z-card2)", color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
              <Icon name="Square" size={11} /> Стоп
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 57px)" }}>
        <aside className="w-52 flex flex-col border-r shrink-0" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
          <div className="p-3 border-b flex flex-col items-center" style={{ borderColor: "var(--z-border)", background: "linear-gradient(180deg,rgba(0,90,160,0.12) 0%,transparent 100%)" }}>
            <img src={DOLPHIN_URL} alt="mascot" className="w-20 object-contain"
              style={{ filter: "drop-shadow(0 0 14px rgba(0,180,255,0.45))" }} />
            <p className="text-xs font-bold mt-1" style={{ color: "var(--z-blue)" }}>ZetixHost</p>
            <p className="text-xs font-mono" style={{ color: "var(--z-muted)" }}>:{server.port}</p>
          </div>
          <nav className="flex flex-col p-1.5 gap-0.5">
            {sideItems.map(item => (
              <button key={item.key} onClick={() => setTab(item.key)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left"
                style={tab === item.key
                  ? { background: "rgba(0,180,255,0.1)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }
                  : { color: "var(--z-muted)", border: "1px solid transparent" }}>
                <Icon name={item.icon} fallback="Circle" size={13} />{item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto m-2 p-3 rounded-xl text-xs" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
            <p className="font-semibold text-white mb-1.5">Характеристики</p>
            {[["CPU", server.plan.cpu as string], ["RAM", server.plan.ram as string], ["Диск", server.plan.disk as string]].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-1 mb-1" style={{ color: "var(--z-muted)" }}>
                <span>{l}</span><span className="text-white truncate ml-1 text-right">{(v as string).split(" ").slice(0,2).join(" ")}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* CONSOLE */}
          {tab === "console" && (
            <div className="flex flex-col h-full">
              {status === "online" && (
                <div className="px-4 py-2 border-b grid grid-cols-4 gap-3" style={{ borderColor: "var(--z-border)", background: "var(--z-card2)" }}>
                  <MiniBar label="CPU" val={cpu} color="#22c55e" />
                  <MiniBar label="RAM" val={ram} color="#00b4ff" />
                  <MiniBar label="NET" val={net} color="#f59e0b" />
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs" style={{ color: "var(--z-muted)" }}>
                      <span>Игроки</span><span style={{ color: "#a78bfa" }}>{players}/20</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--z-card)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(players/20)*100}%`, background: "#a78bfa" }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed" style={{ background: "#080a0e" }}>
                {logs.map((l, i) => (
                  <div key={i} className="mb-0.5"
                    style={{ color: l.startsWith(">") ? "#00b4ff" : l.includes("ERROR") ? "#ef4444" : l.includes("Done") || l.includes("запущен") ? "#22c55e" : l.includes("WARN") ? "#f59e0b" : "#8090a8" }}>
                    {l}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
              <form onSubmit={sendCmd} className="flex gap-2 p-3 border-t" style={{ borderColor: "var(--z-border)", background: "var(--z-card)" }}>
                <span className="font-mono text-sm self-center" style={{ color: "var(--z-blue)" }}>&gt;</span>
                <input className="flex-1 bg-transparent outline-none text-sm font-mono text-white"
                  placeholder={status === "online" ? "Введите команду..." : "Сервер остановлен"}
                  value={cmd} onChange={e => setCmd(e.target.value)} disabled={status !== "online"} />
                <button type="submit" disabled={status !== "online"} className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: "rgba(0,180,255,0.12)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
                  <Icon name="Send" size={12} />
                </button>
              </form>
            </div>
          )}

          {/* FILES */}
          {tab === "files" && (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 border-r flex flex-col" style={{ borderColor: "var(--z-border)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--z-border)" }}>
                  <span className="font-semibold text-white text-sm flex items-center gap-2">
                    <Icon name="FolderOpen" size={13} style={{ color: "var(--z-blue)" }} />Файлы
                  </span>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg"
                    style={{ background: "rgba(0,180,255,0.1)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
                    <Icon name="Upload" size={11} />Загрузить
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const ext = f.name.split(".").pop() || "";
                    setFiles(p => [...p, { name: f.name, type: "file", size: `${(f.size/1024).toFixed(1)} KB`, ext }]);
                    e.target.value = "";
                  }} />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {files.map(f => (
                    <div key={f.name}
                      onClick={() => { setSelectedFile(f); if (f.type === "file") setFileContent(f.name === "server.properties" ? `server-port=${server.port}\ngamemode=survival\nmax-players=20` : f.ext === "txt" ? "eula=true" : `# ${f.name}`); }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-all"
                      style={selectedFile?.name === f.name ? { background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.2)" } : { border: "1px solid transparent" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name={f.type === "folder" ? "Folder" : f.ext === "jar" ? "Package" : "FileText"} fallback="File" size={13}
                          style={{ color: f.type === "folder" ? "#f59e0b" : f.ext === "jar" ? "#a78bfa" : "var(--z-muted)", flexShrink: 0 }} />
                        <span className="text-xs truncate" style={{ color: selectedFile?.name === f.name ? "white" : "var(--z-text)" }}>{f.name}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setFiles(p => p.filter(x => x.name !== f.name)); if (selectedFile?.name === f.name) setSelectedFile(null); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded">
                        <Icon name="Trash2" size={10} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                {selectedFile && selectedFile.type === "file" ? (
                  <>
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--z-border)" }}>
                      <span className="font-semibold text-white text-sm">{selectedFile.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { addLog(`[ZetixHost] Файл ${selectedFile.name} сохранён`); setSelectedFile(null); }}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(0,180,255,0.1)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
                          <Icon name="Save" size={11} />Сохранить
                        </button>
                        <button onClick={() => setSelectedFile(null)} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
                          <Icon name="X" size={11} />
                        </button>
                      </div>
                    </div>
                    <textarea className="flex-1 p-4 font-mono text-xs resize-none outline-none" spellCheck={false}
                      style={{ background: "#080a0e", color: "#a8b8c8", lineHeight: 1.7 }}
                      value={fileContent} onChange={e => setFileContent(e.target.value)} />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center" style={{ color: "var(--z-muted)" }}>
                    <div className="text-center"><Icon name="FileText" size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Выберите файл</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DATABASE */}
          {tab === "db" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                <h3 className="font-bold text-white">База данных</h3>
                <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Live</span>
              </div>
              <div className="flex flex-col gap-3">
                {dbRecords.map(r => (
                  <div key={r.table} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                    <div className="flex items-center gap-3">
                      <Icon name="Table" size={15} style={{ color: "var(--z-blue)" }} />
                      <div>
                        <p className="font-semibold text-white text-sm">{r.table}</p>
                        <p className="text-xs" style={{ color: "var(--z-muted)" }}>{r.rows} записей</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">{r.size}</p>
                      <p className="text-xs" style={{ color: "#22c55e" }}>● активна</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBDOMAINS */}
          {tab === "subdomains" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                <h3 className="font-bold text-white">Субдомены</h3>
                <span className="text-xs ml-auto" style={{ color: "#22c55e" }}>Live</span>
              </div>
              <form onSubmit={e => { e.preventDefault(); if (!newSub.trim()) return; setSubdomains(p => [...p, { name: `${newSub}.msk.zetixhost.me`, target: `msk.zetixhost.me:${server.port}`, created: new Date().toLocaleDateString("ru-RU") }]); setNewSub(""); }} className="flex gap-2 mb-5">
                <input className="z-input flex-1 text-sm" placeholder="prefix (например mc)" value={newSub} onChange={e => setNewSub(e.target.value.replace(/[^a-z0-9-]/gi,""))} />
                <button type="submit" className="z-btn-primary px-4 py-2 text-sm">+ Добавить</button>
              </form>
              <div className="flex flex-col gap-3">
                {subdomains.map(s => (
                  <div key={s.name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                    <div>
                      <p className="font-mono text-sm font-semibold" style={{ color: "var(--z-blue)" }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--z-muted)" }}>→ {s.target} · {s.created}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#22c55e" }}>● активен</span>
                      <button onClick={() => setSubdomains(p => p.filter(x => x.name !== s.name))} className="p-1.5 rounded-lg hover:bg-red-500/10">
                        <Icon name="Trash2" size={13} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CO-OWNERS */}
          {tab === "co-owners" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                <h3 className="font-bold text-white">Совладельцы</h3>
                <span className="text-xs ml-auto" style={{ color: "#22c55e" }}>Live</span>
              </div>
              <p className="text-sm mb-5" style={{ color: "var(--z-muted)" }}>Добавляйте друзей по email — они получат доступ к управлению</p>
              <form onSubmit={e => {
                e.preventDefault();
                if (!newOwnerEmail.trim()) return;
                if (coOwners.find(o => o.email === newOwnerEmail)) { setOwnerMsg("Уже добавлен"); return; }
                setCoOwners(p => [...p, { email: newOwnerEmail, addedAt: new Date().toLocaleTimeString("ru-RU") }]);
                pushAdminLog({ time: nowStr(), msg: `Совладелец ${newOwnerEmail} добавлен к серверу ${server.id}`, type: "info" });
                setOwnerMsg(`${newOwnerEmail} добавлен`);
                setNewOwnerEmail("");
                setTimeout(() => setOwnerMsg(""), 2500);
              }} className="flex gap-2 mb-2">
                <input className="z-input flex-1 text-sm" type="email" placeholder="email@example.com" value={newOwnerEmail} onChange={e => { setNewOwnerEmail(e.target.value); setOwnerMsg(""); }} />
                <button type="submit" className="z-btn-primary px-4 py-2 text-sm">
                  <Icon name="UserPlus" size={13} /> Добавить
                </button>
              </form>
              {ownerMsg && <p className="text-sm mb-4" style={{ color: "#22c55e" }}>✓ {ownerMsg}</p>}
              {coOwners.length === 0 ? (
                <div className="text-center py-10" style={{ color: "var(--z-muted)" }}>
                  <Icon name="Users" size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Нет совладельцев</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-3">
                  {coOwners.map(o => (
                    <div key={o.email} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)" }}>
                          {o.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{o.email}</p>
                          <p className="text-xs" style={{ color: "var(--z-muted)" }}>Добавлен в {o.addedAt}</p>
                        </div>
                      </div>
                      <button onClick={() => setCoOwners(p => p.filter(x => x.email !== o.email))} className="p-1.5 rounded-lg hover:bg-red-500/10">
                        <Icon name="Trash2" size={13} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {tab === "settings" && (
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-white mb-5">Настройки сервера</h3>
              <div className="p-4 rounded-xl mb-4" style={{ background: "var(--z-card2)", border: "1px solid rgba(0,180,255,0.2)" }}>
                <p className="text-xs font-semibold text-white mb-2">IP для подключения</p>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--z-card)", border: "1px solid rgba(0,180,255,0.15)" }}>
                  <Icon name="Globe" size={14} style={{ color: "var(--z-blue)" }} />
                  <span className="font-mono text-sm" style={{ color: "var(--z-blue)" }}>msk.zetixhost.me:{server.port}</span>
                  <button onClick={() => navigator.clipboard.writeText(`msk.zetixhost.me:${server.port}`)} className="ml-auto text-xs px-2 py-1 rounded" style={{ color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
                    <Icon name="Copy" size={11} />
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                {[["Название","ZetixHost Server"],["MOTD","Welcome!"],["Порт",String(server.port)],["Режим","survival"],["Сложность","normal"],["Макс. игроков","20"]].map(([l,v]) => (
                  <div key={l} className="p-4 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                    <label className="text-xs block mb-1.5" style={{ color: "var(--z-muted)" }}>{l}</label>
                    <input className="z-input text-sm py-2" defaultValue={v} />
                  </div>
                ))}
              </div>
              <button className="z-btn-primary mt-5 px-5 py-2.5 text-sm"><Icon name="Save" size={13} />Сохранить</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── My Servers List ──────────────────────────────────────────────────────────
function MyServersPage({ user, onOpenServer, onBack, onBuyMore }: {
  user: UserState; onOpenServer: (s: ServerInfo) => void; onBack: () => void; onBuyMore: () => void;
}) {
  return (
    <div className="min-h-screen pt-20 px-6 pb-12" style={{ background: "var(--z-bg)" }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm hover:text-white transition-colors" style={{ color: "var(--z-muted)" }}>
          <Icon name="ArrowLeft" size={14} /> Главная
        </button>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Мои серверы
            <span className="text-base font-normal ml-2" style={{ color: "var(--z-muted)" }}>({user.servers.length}/{MAX_SERVERS})</span>
          </h2>
          {user.servers.length < MAX_SERVERS && (
            <button onClick={onBuyMore} className="z-btn-primary px-4 py-2 text-sm">
              <Icon name="Plus" size={13} />Добавить сервер
            </button>
          )}
        </div>
        {user.servers.length === 0 ? (
          <div className="text-center py-20 z-card">
            <Icon name="Server" size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-white font-semibold mb-2">У вас нет серверов</p>
            <button onClick={onBuyMore} className="z-btn-primary px-5 py-2.5 text-sm mt-2">
              <Icon name="ShoppingCart" size={13} />Купить тариф
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.servers.map(s => (
              <div key={s.id} className="z-card p-5 cursor-pointer hover:border-blue-500/40 transition-all" onClick={() => onOpenServer(s)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white">{s.plan.id}</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.status === "online" ? "#22c55e" : "#ef4444", boxShadow: `0 0 5px ${s.status === "online" ? "#22c55e" : "#ef4444"}` }} />
                    <span style={{ color: "var(--z-muted)" }}>{s.status === "online" ? "Работает" : "Остановлен"}</span>
                  </div>
                </div>
                <p className="text-sm font-mono mb-3" style={{ color: "var(--z-blue)" }}>msk.zetixhost.me:{s.port}</p>
                <div className="flex gap-3 text-xs" style={{ color: "var(--z-muted)" }}>
                  <span>{s.plan.ram as string}</span><span>·</span><span>{s.plan.disk as string}</span>
                </div>
                <button className="z-btn-primary w-full justify-center py-2 text-sm mt-4">
                  <Icon name="LayoutDashboard" size={13} />Управлять
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ mode, setMode, onBack, onSuccess }: {
  mode: AuthMode; setMode: (m: AuthMode) => void; onBack: () => void; onSuccess: (u: UserState) => void;
}) {
  const [form, setForm] = useState({ email: "", password: "", name: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    onSuccess({ name: form.name || form.email.split("@")[0], email: form.email, password: form.password, balance: 0, isAdmin: false, servers: [] });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--z-bg)" }}>
      <div className="hidden md:flex flex-1 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 50%, rgba(0,90,160,0.12) 0%, transparent 70%)" }} />
        <img src={DOLPHIN_URL} alt="dolphin" className="absolute right-0 bottom-0 w-80 opacity-25 object-contain" style={{ filter: "drop-shadow(0 0 40px rgba(0,180,255,0.3))" }} />
        <h2 className="text-4xl font-bold text-white mb-2 relative">{mode === "login" ? "С возвращением" : "Добро пожаловать"}</h2>
        <p className="text-4xl font-bold relative" style={{ color: "var(--z-blue)" }}>в ZetixHost</p>
        <button onClick={onBack} className="flex items-center gap-2 mt-10 text-sm hover:text-white transition-colors relative" style={{ color: "var(--z-muted)" }}>
          <Icon name="ArrowLeft" size={13} />На главную
        </button>
      </div>
      <div className="flex-1 md:flex-none md:w-[460px] flex items-center justify-center p-6">
        <div className="w-full max-w-sm z-card p-8">
          <div className="flex justify-center mb-6">
            <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 10, width: 44, height: 44 }}
              className="flex items-center justify-center font-bold text-white text-xl">Z</div>
          </div>
          <h3 className="text-center text-white font-semibold text-lg mb-6">{mode === "login" ? "Вход в аккаунт" : "Регистрация"}</h3>
          {error && <div className="mb-4 p-3 rounded-lg text-sm text-center" style={{ background: "rgba(255,60,60,0.1)", color: "#ff6060", border: "1px solid rgba(255,60,60,0.2)" }}>{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && <input className="z-input" placeholder="Имя пользователя" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />}
            <input className="z-input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <input className="z-input" type="password" placeholder="Пароль" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            {mode === "register" && <input className="z-input" type="password" placeholder="Повторите пароль" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />}
            <button type="submit" disabled={loading} className="z-btn-primary w-full py-3 justify-center text-sm mt-1">
              {loading ? "..." : mode === "login" ? "→ Войти" : "→ Зарегистрироваться"}
            </button>
            {mode === "login" && (
              <>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--z-muted)" }}>
                  <div className="flex-1 h-px" style={{ background: "var(--z-border)" }} />или<div className="flex-1 h-px" style={{ background: "var(--z-border)" }} />
                </div>
                <button type="button" className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2" style={{ background: "#5865F2" }}>
                  🎮 Войти через Discord
                </button>
              </>
            )}
            <p className="text-center text-sm" style={{ color: "var(--z-muted)" }}>
              {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="font-medium" style={{ color: "var(--z-blue)" }}>
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-10 px-6 border-t text-center text-sm" style={{ borderColor: "var(--z-border)", color: "var(--z-muted)" }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 6, width: 24, height: 24 }}
          className="flex items-center justify-center font-bold text-white text-xs">Z</div>
        <span className="font-semibold text-white">ZetixHost</span>
      </div>
      <p>© 2024 ZetixHost. Все права защищены.</p>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [user, setUser] = useState<UserState | null>(null);
  const [buyingPlan, setBuyingPlan] = useState<PlanAny | null>(null);
  const [activePanelServer, setActivePanelServer] = useState<ServerInfo | null>(null);
  const [panelView, setPanelView] = useState<"list" | "server">("list");
  const [pendingPurchaseId, setPendingPurchaseId] = useState<string | null>(null);

  // Global realtime logs
  useEffect(() => {
    const msgs = ["Heartbeat: все системы работают", "Мониторинг: нагрузка в норме", "Security: 0 угроз обнаружено", "Network: пинг 2ms", "Backup: автоматическое копирование выполнено"];
    const iv = setInterval(() => pushAdminLog({ time: nowStr(), msg: msgs[Math.floor(Math.random() * msgs.length)], type: "info" }), 8000);
    return () => clearInterval(iv);
  }, []);

  const handleBuyPlan = (plan: PlanAny) => {
    if (!user) { setAuthMode("register"); setPage("auth"); setBuyingPlan(plan); return; }
    if (user.servers.length >= MAX_SERVERS) { alert(`Максимум ${MAX_SERVERS} серверов на аккаунт`); return; }
    setBuyingPlan(plan);
  };

  const handlePurchasePending = (id: string) => {
    setPendingPurchaseId(id);
  };

  const handleConfirmPurchase = (id: string, plan: PlanAny) => {
    if (!user) return;
    const port = randPort();
    const newServer: ServerInfo = { plan, port, id, status: "offline" };
    const updated = { ...user, servers: [...user.servers, newServer] };
    setUser(updated);
    setActivePanelServer(newServer);
    setPanelView("server");
    setPage("panel");
    setBuyingPlan(null);
    setPendingPurchaseId(null);
    pushAdminLog({ time: nowStr(), msg: `Сервер ${plan.id} активирован для ${user.email} (порт ${port})`, type: "info" });
  };

  const handleAuthSuccess = (u: UserState) => { setUser(u); setPage("home"); };

  if (page === "panel") {
    if (panelView === "server" && activePanelServer && user) {
      return <ServerPanel server={activePanelServer} user={user} setUser={setUser} onBack={() => setPanelView("list")} />;
    }
    if (user) {
      return <MyServersPage user={user} onOpenServer={s => { setActivePanelServer(s); setPanelView("server"); }} onBack={() => setPage("home")} onBuyMore={() => setPage("home")} />;
    }
  }

  if (page === "profile" && user) {
    return <ProfilePage user={user} setUser={setUser} onBack={() => setPage("home")} onConfirmPurchase={handleConfirmPurchase} />;
  }

  if (page === "auth") {
    return <AuthPage mode={authMode} setMode={setAuthMode} onBack={() => setPage("home")} onSuccess={handleAuthSuccess} />;
  }

  return (
    <div style={{ background: "var(--z-bg)", minHeight: "100vh" }}>
      <Navbar
        onAuthClick={() => { setAuthMode("login"); setPage("auth"); }}
        onPanelClick={() => setPage("panel")}
        onProfileClick={() => setPage("profile")}
        loggedIn={!!user}
        user={user ?? undefined}
      />
      <HeroSection onOrderClick={() => { if (!user) { setAuthMode("register"); setPage("auth"); } }} />
      <AdvantagesSection />
      <ServicesSection onBuy={handleBuyPlan} />
      <Footer />
      {buyingPlan && user && (
        <BuyModal plan={buyingPlan} user={user} onClose={() => setBuyingPlan(null)} onPending={handlePurchasePending} />
      )}
    </div>
  );
}
