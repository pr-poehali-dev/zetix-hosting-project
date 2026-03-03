import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Constants ────────────────────────────────────────────────────────────────
const DOLPHIN_URL = "https://cdn.poehali.dev/projects/dd998167-bb93-472a-9cea-24032a9ccac4/bucket/60e5fcdd-090a-4eb1-92e1-a016cfdeb55a.png";
const HERO_3D_URL = "https://cdn.poehali.dev/projects/dd998167-bb93-472a-9cea-24032a9ccac4/files/56b77026-7717-4ba9-beaa-b47f55299335.jpg";
const SECRET_PROMO = "ADMINMENULOGIN123";
const MAX_SERVERS = 5;
const BONUS_ON_REGISTER = 50;

function randPort() { return Math.floor(10000 + Math.random() * 89999); }
function randId() { return Math.random().toString(36).slice(2, 10); }
function maskPass(p: string) { return "•".repeat(Math.max(8, p.length)); }
function genApiKey() { return "zx_" + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join(""); }

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "home" | "auth" | "panel" | "profile";
type AuthMode = "login" | "register";
type ServiceTab = "game" | "vds" | "web";
type PanelTab = "console" | "files" | "settings" | "db" | "subdomains" | "co-owners";
type ServerStatus = "offline" | "starting" | "online" | "stopping";
type PayMethod = "card" | "sbp" | "sber" | "sberkids" | "balance";

interface PlanAny { id: string; price: number; cpu: string; ram: string; disk: string; net: string; [k: string]: string | number; }
interface ServerFile { name: string; type: "file" | "folder"; size?: string; ext?: string; }
interface ServerInfo { plan: PlanAny; port: number; id: string; status: ServerStatus; apiKey?: string; }
interface AdminLog { time: string; msg: string; type: "info" | "warn" | "purchase" | "auth"; purchaseId?: string; purchasePlan?: PlanAny; authEmail?: string; authPass?: string; }
interface CoOwner { email: string; addedAt: string; }
interface Subdomain { name: string; target: string; created: string; }
interface DbRecord { table: string; rows: number; size: string; }
interface UserState { name: string; email: string; password: string; balance: number; isAdmin: boolean; servers: ServerInfo[]; }

// ─── Plan Data ────────────────────────────────────────────────────────────────
const gamePlans: PlanAny[] = [
  { id: "Кролик", price: 130, cpu: "225%", ram: "2GB DDR4", disk: "16GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
  { id: "Овца", price: 330, cpu: "450%", ram: "4GB DDR4", disk: "32GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
  { id: "Дельфин", price: 529, cpu: "550%", ram: "6GB DDR4", disk: "64GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
  { id: "Ифрит", price: 790, cpu: "850%", ram: "8GB DDR4", disk: "64GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
  { id: "Древний страж", price: 1030, cpu: "950%", ram: "12GB DDR4", disk: "96GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
  { id: "Иссушитель", price: 1319, cpu: "1050%", ram: "16GB DDR4", disk: "96GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
  { id: "Эндермен", price: 1729, cpu: "1300%", ram: "24GB DDR4", disk: "128GB NVMe", ddos: "DDoS защита", flag: "🇷🇺" },
];

const vdsPlans: PlanAny[] = [
  { id: "DE-1", price: 270, cpu: "AMD Ryzen 9 5950X", vcpu: "1 vCPU", ram: "2GB DDR4", disk: "80GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-2", price: 540, cpu: "AMD Ryzen 9 5950X", vcpu: "2 vCPU", ram: "4GB DDR4", disk: "120GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-3", price: 1000, cpu: "AMD Ryzen 9 5950X", vcpu: "4 vCPU", ram: "8GB DDR4", disk: "180GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-4", price: 1670, cpu: "AMD Ryzen 9 5950X", vcpu: "6 vCPU", ram: "16GB DDR4", disk: "240GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-5", price: 1989, cpu: "AMD Ryzen 9 5950X", vcpu: "8 vCPU", ram: "24GB DDR4", disk: "300GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-6", price: 2560, cpu: "AMD Ryzen 9 5950X", vcpu: "12 vCPU", ram: "32GB DDR4", disk: "360GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-7", price: 3840, cpu: "AMD Ryzen 9 5950X", vcpu: "12 vCPU", ram: "48GB DDR4", disk: "480GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
  { id: "DE-8", price: 5120, cpu: "AMD Ryzen 9 5950X", vcpu: "16 vCPU", ram: "64GB DDR4", disk: "520GB NVMe", net: "500 Мбит/с", ddos: "DDoS защита", flag: "🇩🇪" },
];



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

// ─── Global Balance Top-up Store (admin → user) ────────────────────────────
type BalanceTopupEvent = { email: string; amount: number };
let balanceTopupListeners: ((e: BalanceTopupEvent) => void)[] = [];
function triggerBalanceTopup(e: BalanceTopupEvent) { balanceTopupListeners.forEach(fn => fn(e)); }
function useBalanceTopup(callback: (e: BalanceTopupEvent) => void) {
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    const fn = (e: BalanceTopupEvent) => cb.current(e);
    balanceTopupListeners.push(fn);
    return () => { balanceTopupListeners = balanceTopupListeners.filter(f => f !== fn); };
  }, []);
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
    <section className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 40%, #070d20 100%)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(60,60,180,0.25) 0%, transparent 65%)" }} />
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
            <span>🇩🇪</span>
            <span>Запустили продажу VDS в Германии!</span>
            <a href="#services" className="ml-1 font-semibold" style={{ color: "var(--z-blue)" }}>Подробнее</a>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-5">
            Идеальный хостинг для<br />
            <span style={{ color: "#a855f7" }}>вашего проекта</span>
          </h1>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.55)" }}>
            воплощайте свои фантазии в реальность, и покоряйте<br />вершины вместе с нами
          </p>
          <button onClick={onOrderClick}
            className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}>
            → Перейти к услугам
          </button>
        </div>
        <div className="flex justify-end items-center">
          <img src={HERO_3D_URL} alt="3D shape" className="w-full max-w-lg object-contain rounded-2xl"
            style={{ filter: "drop-shadow(0 0 80px rgba(80,80,220,0.5))" }} />
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
function GamePlanCard({ plan, onBuy }: { plan: PlanAny; onBuy: (p: PlanAny) => void }) {
  return (
    <div className="flex flex-col rounded-2xl p-5 transition-all hover:border-white/20 cursor-pointer"
      style={{ background: "#111214", border: "1px solid #222428", minHeight: 220 }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{plan.flag as string}</span>
        <span className="font-bold text-white text-base">{plan.id}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
          <Icon name="Globe" fallback="Circle" size={11} style={{ color: "#aaa" }} />
          <span>{plan.cpu as string} CPU</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
          <Icon name="MemoryStick" fallback="Circle" size={11} style={{ color: "#aaa" }} />
          <span>{plan.ram as string}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
          <Icon name="HardDrive" fallback="Circle" size={11} style={{ color: "#aaa" }} />
          <span>{plan.disk as string}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
          <Icon name="Shield" fallback="Circle" size={11} style={{ color: "#aaa" }} />
          <span>{plan.ddos as string}</span>
        </div>
      </div>
      <div className="mt-auto">
        <div className="mb-3">
          <span className="text-3xl font-extrabold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽</span>
          <div className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>в месяц</div>
        </div>
        <button onClick={() => onBuy(plan)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "white" }}>
          <Icon name="ShoppingBag" fallback="ShoppingCart" size={13} />
          Приобрести — {(plan.price as number).toLocaleString("ru-RU")}₽
        </button>
      </div>
    </div>
  );
}

function VdsDePlanCard({ plan, onBuy }: { plan: PlanAny; onBuy: (p: PlanAny) => void }) {
  return (
    <div className="flex flex-col rounded-2xl p-5 transition-all hover:border-white/20 cursor-pointer"
      style={{ background: "#111214", border: "1px solid #222428", minHeight: 260 }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{plan.flag as string}</span>
        <span className="font-bold text-white text-base">{plan.id}</span>
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#aaa" }}>
          <Icon name="Globe" fallback="Circle" size={11} style={{ color: "#aaa" }} />
          <span>{plan.cpu as string}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
            <Icon name="Cpu" fallback="Circle" size={11} style={{ color: "#aaa" }} />
            <span>{plan.vcpu as string}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
            <Icon name="MemoryStick" fallback="Circle" size={11} style={{ color: "#aaa" }} />
            <span>{plan.ram as string}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
            <Icon name="HardDrive" fallback="Circle" size={11} style={{ color: "#aaa" }} />
            <span>{plan.disk as string}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
            <Icon name="Wifi" fallback="Circle" size={11} style={{ color: "#aaa" }} />
            <span>{plan.net as string}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1a1b1f", color: "#aaa" }}>
          <Icon name="Shield" fallback="Circle" size={11} style={{ color: "#aaa" }} />
          <span>{plan.ddos as string}</span>
        </div>
      </div>
      <div className="mt-auto">
        <div className="mb-3">
          <span className="text-3xl font-extrabold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽</span>
          <div className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>в месяц</div>
        </div>
        <button onClick={() => onBuy(plan)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "white" }}>
          <Icon name="ShoppingBag" fallback="ShoppingCart" size={13} />
          Приобрести — {(plan.price as number).toLocaleString("ru-RU")}₽
        </button>
      </div>
    </div>
  );
}

function PlanCard({ plan, onBuy }: { plan: PlanAny; onBuy: (p: PlanAny) => void }) {
  return <GamePlanCard plan={plan} onBuy={onBuy} />;
}

// ─── Services ─────────────────────────────────────────────────────────────────
function ServicesSection({ onBuy }: { onBuy: (p: PlanAny) => void }) {
  const [tab, setTab] = useState<ServiceTab>("game");
  const tabs = [
    { key: "game" as ServiceTab, icon: "Gamepad2", label: "🇷🇺 VDS Россия" },
    { key: "vds" as ServiceTab, icon: "Server", label: "🇩🇪 VDS Германия" },
    { key: "web" as ServiceTab, icon: "Globe", label: "Веб серверы" },
  ];
  return (
    <section id="services" className="py-20 px-6" style={{ background: "var(--z-bg)" }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-2">Наши тарифы</h2>
        <p className="text-center mb-10" style={{ color: "var(--z-blue)" }}>Выберите подходящий тариф</p>
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={tab === t.key
                ? { background: "var(--z-card2)", border: "1px solid var(--z-border)", color: "white" }
                : { color: "var(--z-muted)", border: "1px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "web" ? (
          <div className="text-center py-20" style={{ color: "var(--z-muted)" }}>
            <Icon name="Globe" size={48} className="mx-auto mb-4 opacity-20" />
            <p>Веб-серверы скоро появятся</p>
          </div>
        ) : tab === "game" ? (
          <div id="plans" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gamePlans.map(p => <GamePlanCard key={p.id} plan={p} onBuy={onBuy} />)}
          </div>
        ) : (
          <div id="plans" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vdsPlans.map(p => <VdsDePlanCard key={p.id} plan={p} onBuy={onBuy} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Buy Modal ────────────────────────────────────────────────────────────────
function BuyModal({ plan, user, onClose, onBuy }: {
  plan: PlanAny; user: UserState; onClose: () => void; onBuy: () => void;
}) {
  const [method, setMethod] = useState<PayMethod>("balance");
  const [card, setCard] = useState(""); const [cardName, setCardName] = useState(""); const [expiry, setExpiry] = useState(""); const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const price = plan.price as number;
  const hasBalance = user.balance >= price;

  const handleExpiry = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); setExpiry(d.length > 2 ? d.slice(0,2)+"/"+d.slice(2) : d); };

  const submitPayment = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    pushAdminLog({ time: nowStr(), msg: `Покупка: ${user.email} оплатил тариф ${plan.id} — ${plan.price}₽`, type: "purchase", purchaseId: randId(), purchasePlan: plan });
    onBuy();
  };

  const buyFromBalance = () => {
    if (!hasBalance) return;
    pushAdminLog({ time: nowStr(), msg: `Покупка с баланса: ${user.email} приобрёл тариф ${plan.id} — ${price}₽`, type: "purchase", purchaseId: randId(), purchasePlan: plan });
    onBuy();
  };

  const payMethods: { key: PayMethod; label: string; icon: string }[] = [
    { key: "balance", label: "Баланс", icon: "Wallet" },
    { key: "card", label: "Банковская карта", icon: "CreditCard" },
    { key: "sbp", label: "СБП", icon: "Smartphone" },
    { key: "sber", label: "Сбербанк", icon: "Building" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
      <div className="z-card p-7 max-w-md w-full" style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-white">Оплата тарифа</h3>
            <p className="text-sm" style={{ color: "var(--z-blue)" }}>{plan.id} — {price.toLocaleString("ru-RU")}₽/мес.</p>
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
        {method === "balance" ? (
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(0,180,255,0.06)", border: "1px solid rgba(0,180,255,0.15)" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: "var(--z-muted)" }}>Ваш баланс:</span>
              <span className="text-white font-bold text-lg">{user.balance.toLocaleString("ru-RU")}₽</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: "var(--z-muted)" }}>К оплате:</span>
              <span className="text-white font-bold text-lg">{price.toLocaleString("ru-RU")}₽</span>
            </div>
            {hasBalance ? (
              <>
                <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <span className="text-sm" style={{ color: "#22c55e" }}>После оплаты останется:</span>
                  <span className="font-bold" style={{ color: "#22c55e" }}>{(user.balance - price).toLocaleString("ru-RU")}₽</span>
                </div>
                <button onClick={buyFromBalance} className="z-btn-primary w-full py-3 justify-center text-sm">
                  <Icon name="ShoppingBag" fallback="ShoppingCart" size={14} /> Приобрести — {price.toLocaleString("ru-RU")}₽
                </button>
              </>
            ) : (
              <>
                <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-sm" style={{ color: "#ef4444" }}>Недостаточно средств. Не хватает {(price - user.balance).toLocaleString("ru-RU")}₽</p>
                </div>
                <a href="https://t.me/HellwayYT" target="_blank" rel="noopener noreferrer"
                  className="z-btn-primary w-full py-3 justify-center text-sm flex items-center gap-2">
                  <Icon name="Send" size={14} /> Пополнить баланс
                </a>
              </>
            )}
          </div>
        ) : method !== "card" ? (
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(0,180,255,0.06)", border: "1px solid rgba(0,180,255,0.15)" }}>
            <p className="font-semibold text-white mb-2">{method === "sbp" ? "Оплата по СБП" : "Оплата Сбербанк"}</p>
            <p style={{ color: "var(--z-muted)" }}>{method === "sbp" ? "📱 СБП на номер:" : "🏦 Перевод на карту:"}<br />
              <span className="text-white font-mono">{method === "sbp" ? "+7 921 700-61-74" : "2202 2082 8801 8451"}</span>
            </p>
            <p className="mt-2" style={{ color: "var(--z-muted)" }}>Сумма: <span className="text-white font-bold">{price.toLocaleString("ru-RU")}₽</span></p>
            <button onClick={submitPayment} disabled={loading} className="z-btn-primary w-full py-3 justify-center text-sm mt-4">
              {loading ? <><Icon name="Loader2" size={14} className="animate-spin" /> Обработка...</> : <><Icon name="Zap" size={14} /> Оплатить</>}
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
  const [topupEmail, setTopupEmail] = useState("");
  const [topupAmt, setTopupAmt] = useState("");
  const [topupMsg, setTopupMsg] = useState<"" | "sent">("") ;

  const handleConfirm = (log: AdminLog) => {
    if (!log.purchaseId || !log.purchasePlan) return;
    setConfirmed(prev => new Set([...prev, log.purchaseId!]));
    onConfirmPurchase(log.purchaseId!, log.purchasePlan!);
    pushAdminLog({ time: nowStr(), msg: `✅ Покупка ${log.purchaseId} подтверждена — сервер активирован`, type: "info" });
  };

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(topupAmt);
    if (!topupEmail.trim() || !amt || amt < 1) return;
    triggerBalanceTopup({ email: topupEmail.trim(), amount: amt });
    pushAdminLog({ time: nowStr(), msg: `💰 Баланс пополнен: ${topupEmail.trim()} +${amt}₽ (admin)`, type: "info" });
    setTopupMsg("sent");
    setTopupEmail(""); setTopupAmt("");
    setTimeout(() => setTopupMsg(""), 3000);
  };

  return (
    <div className="z-card mt-6 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
        <h4 className="font-bold text-white text-sm">Логи системы (реальное время)</h4>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Live</span>
      </div>

      {/* Admin balance top-up */}
      <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(0,180,255,0.06)", border: "1px solid rgba(0,180,255,0.15)" }}>
        <p className="text-xs font-bold mb-2" style={{ color: "var(--z-blue)" }}>Пополнить баланс пользователю</p>
        <form onSubmit={handleTopup} className="flex flex-col gap-2">
          <input className="z-input text-sm py-1.5" placeholder="Email пользователя" value={topupEmail} onChange={e => setTopupEmail(e.target.value)} required />
          <div className="flex gap-2">
            <input className="z-input text-sm py-1.5 flex-1" type="number" min="1" placeholder="Сумма ₽" value={topupAmt} onChange={e => setTopupAmt(e.target.value)} required />
            <button type="submit" className="z-btn-primary px-4 py-1.5 text-xs">
              <Icon name="Plus" size={12} /> Пополнить
            </button>
          </div>
          {topupMsg === "sent" && <p className="text-xs" style={{ color: "#22c55e" }}>✓ Баланс пополнен в реальном времени</p>}
        </form>
      </div>

      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {logs.map((log, i) => {
          const dotColor = log.type === "purchase" ? "#f59e0b" : log.type === "auth" ? "#a855f7" : "#22c55e";
          const bg = log.type === "purchase" ? "rgba(245,158,11,0.06)" : log.type === "auth" ? "rgba(168,85,247,0.06)" : "var(--z-card2)";
          const bdr = log.type === "purchase" ? "rgba(245,158,11,0.2)" : log.type === "auth" ? "rgba(168,85,247,0.25)" : "var(--z-border)";
          return (
            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg"
              style={{ background: bg, border: `1px solid ${bdr}` }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: "var(--z-muted)" }}>{log.time}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                <span className="text-sm" style={{ color: log.type === "purchase" ? "#fbbf24" : log.type === "auth" ? "#c084fc" : "var(--z-text)" }}>{log.msg}</span>
              </div>
              {log.type === "auth" && log.authEmail && (
                <div className="flex flex-col gap-1 pl-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--z-muted)" }}>📧 Email:</span>
                    <span style={{ color: "#c084fc" }}>{log.authEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--z-muted)" }}>🔑 Пароль:</span>
                    <span style={{ color: "#f9a8d4" }}>{log.authPass}</span>
                  </div>
                </div>
              )}
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
          );
        })}
      </div>
    </div>
  );
}

// ─── Balance Topup Form (visible to all users, topups by email) ───────────────
function BalanceTopupForm({ currentUser, setUser }: { currentUser: UserState; setUser: (u: UserState) => void }) {
  const [email, setEmail] = useState(currentUser.email);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<"" | "success" | "notfound">("") ;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!email.trim() || !amt || amt < 1) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);
    const accounts = getAccounts();
    const key = email.trim().toLowerCase();
    if (!accounts[key]) { setMsg("notfound"); return; }
    triggerBalanceTopup({ email: key, amount: amt });
    const updated = { ...accounts[key], balance: accounts[key].balance + amt };
    saveAccount(updated);
    broadcastAccountUpdate(updated);
    if (key === currentUser.email.toLowerCase()) {
      setUser({ ...currentUser, balance: currentUser.balance + amt });
    }
    pushAdminLog({ time: nowStr(), msg: `💰 Пополнение баланса: ${key} +${amt}₽`, type: "info" });
    setMsg("success");
    setAmount("");
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div className="z-card p-6 mb-4">
      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
        <Icon name="Wallet" size={15} style={{ color: "var(--z-blue)" }} /> Пополнить баланс
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--z-muted)" }}>
        Введите почту и сумму — баланс пополнится мгновенно в реальном времени.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="z-input" type="email" placeholder="Email аккаунта" value={email}
          onChange={e => { setEmail(e.target.value); setMsg(""); }} required />
        <div className="flex gap-2">
          <input className="z-input flex-1" type="number" min="1" placeholder="Сумма ₽" value={amount}
            onChange={e => { setAmount(e.target.value); setMsg(""); }} required />
          <button type="submit" disabled={loading} className="z-btn-primary px-5 py-2 text-sm">
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <><Icon name="Plus" size={13} /> Пополнить</>}
          </button>
        </div>
      </form>
      {msg === "success" && (
        <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
          <Icon name="CheckCircle" size={14} /> Баланс успешно пополнен на {amount}₽
        </div>
      )}
      {msg === "notfound" && (
        <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          Аккаунт с такой почтой не найден
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, setUser, onBack, onConfirmPurchase, onLogout }: {
  user: UserState; setUser: (u: UserState) => void; onBack: () => void; onConfirmPurchase: (id: string, plan: PlanAny) => void; onLogout: () => void;
}) {
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<"" | "success" | "error">("");
  const [showPass, setShowPass] = useState(false);

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

        {/* Deposit info */}
        <div className="z-card p-6 mb-4">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Icon name="Wallet" size={15} style={{ color: "var(--z-blue)" }} /> Пополнить баланс
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--z-muted)" }}>
            Пополнение баланса доступно только через техническую поддержку. Напишите нам в Telegram — ответим быстро.
          </p>
          <a href="https://t.me/HellwayYT" target="_blank" rel="noopener noreferrer"
            className="z-btn-primary py-2.5 justify-center text-sm flex items-center gap-2 w-full">
            <Icon name="Send" size={13} /> Написать в поддержку @HellwayYT
          </a>
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

        {/* Logout */}
        <div className="mt-4">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10"
            style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <Icon name="LogOut" size={14} /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ server, user, setUser }: { server: ServerInfo; user: UserState; setUser: (u: UserState) => void }) {
  const [apiKey, setApiKey] = useState(server.apiKey || "");
  const [apiCopied, setApiCopied] = useState(false);
  const [apiVisible, setApiVisible] = useState(false);
  const [javaVer, setJavaVer] = useState("17");
  const [pteroPanel, setPteroPanel] = useState("");
  const [pteroToken, setPteroToken] = useState("");
  const [pteroSaved, setPteroSaved] = useState(false);
  const javaVersions = ["8", "11", "16", "17", "21", "25"];

  const handleGenerateKey = () => {
    const key = genApiKey();
    setApiKey(key);
    const updatedServers = user.servers.map(s => s.id === server.id ? { ...s, apiKey: key } : s);
    const updatedUser = { ...user, servers: updatedServers };
    setUser(updatedUser);
    saveAccount(updatedUser);
    pushAdminLog({ time: nowStr(), msg: `🔑 API ключ обновлён для сервера ${server.id} (${user.email})`, type: "info" });
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setApiCopied(true);
    setTimeout(() => setApiCopied(false), 2000);
  };

  return (
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

      {/* API Key */}
      <div className="p-4 rounded-xl mb-4" style={{ background: "var(--z-card2)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Key" size={14} style={{ color: "#f59e0b" }} />
          <p className="text-xs font-bold" style={{ color: "#f59e0b" }}>API ключ</p>
        </div>
        {apiKey ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--z-card)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="font-mono text-xs flex-1 truncate" style={{ color: "var(--z-text)" }}>
                {apiVisible ? apiKey : apiKey.slice(0, 8) + "•".repeat(24)}
              </span>
              <button onClick={() => setApiVisible(v => !v)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
                <Icon name={apiVisible ? "EyeOff" : "Eye"} size={11} />
              </button>
              <button onClick={handleCopyKey} className="text-xs px-2 py-1 rounded transition-colors" style={{ color: apiCopied ? "#22c55e" : "var(--z-muted)", border: "1px solid var(--z-border)" }}>
                <Icon name={apiCopied ? "Check" : "Copy"} size={11} />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleGenerateKey} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                <Icon name="RefreshCw" size={11} /> Перегенерировать
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--z-muted)" }}>Используй ключ для интеграции со сторонними сервисами и ботами</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "var(--z-muted)" }}>API ключ позволяет управлять сервером через сторонние сервисы</p>
            <button onClick={handleGenerateKey} className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
              <Icon name="Key" size={12} /> Создать API ключ
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 mb-4">
        {[["Название","ZetixHost Server"],["MOTD","Welcome!"],["Порт",String(server.port)],["Режим","survival"],["Сложность","normal"],["Макс. игроков","20"]].map(([l,v]) => (
          <div key={l} className="p-4 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
            <label className="text-xs block mb-1.5" style={{ color: "var(--z-muted)" }}>{l}</label>
            <input className="z-input text-sm py-2" defaultValue={v} />
          </div>
        ))}
      </div>

      {/* Java Version */}
      <div className="p-4 rounded-xl mb-4" style={{ background: "var(--z-card2)", border: "1px solid rgba(34,197,94,0.25)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Coffee" fallback="Cpu" size={14} style={{ color: "#22c55e" }} />
          <p className="text-xs font-bold" style={{ color: "#22c55e" }}>Версия Java</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {javaVersions.map(v => (
            <button key={v} onClick={() => setJavaVer(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={javaVer === v
                ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }
                : { background: "var(--z-card)", color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
              Java {v}
            </button>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--z-muted)" }}>Выбрано: <span style={{ color: "#22c55e" }}>Java {javaVer}</span> — изменится после перезапуска сервера</p>
      </div>

      {/* Pterodactyl */}
      <div className="p-4 rounded-xl mb-4" style={{ background: "var(--z-card2)", border: "1px solid rgba(139,92,246,0.3)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Bird" fallback="Server" size={14} style={{ color: "#8b5cf6" }} />
          <p className="text-xs font-bold" style={{ color: "#8b5cf6" }}>Pterodactyl Panel</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>Beta</span>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--z-muted)" }}>URL панели (например: https://panel.example.com)</label>
            <input className="z-input text-sm py-2" placeholder="https://panel.example.com" value={pteroPanel}
              onChange={e => { setPteroPanel(e.target.value); setPteroSaved(false); }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--z-muted)" }}>API Token (Client API Key)</label>
            <input className="z-input text-sm py-2 font-mono" placeholder="ptlc_..." value={pteroToken} type="password"
              onChange={e => { setPteroToken(e.target.value); setPteroSaved(false); }} />
          </div>
          <button onClick={() => { if (pteroPanel && pteroToken) { setPteroSaved(true); pushAdminLog({ time: nowStr(), msg: `🦅 Pterodactyl подключён: ${pteroPanel} (${user.email})`, type: "info" }); } }}
            className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Icon name="Link" size={12} /> {pteroSaved ? "✓ Подключено" : "Подключить Pterodactyl"}
          </button>
          {pteroSaved && (
            <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: "rgba(139,92,246,0.08)", color: "#a78bfa" }}>
              <Icon name="CheckCircle" size={12} /> Pterodactyl Panel подключена успешно
            </div>
          )}
        </div>
      </div>

      <button className="z-btn-primary mt-2 px-5 py-2.5 text-sm"><Icon name="Save" size={13} />Сохранить</button>
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
    const c = cmd.trim().toLowerCase();
    if (c === "help") addLog("[INFO]: Commands: help, list, stop, say <msg>, install paper, install spigot, install vanilla, install purpur, install fabric, install forge");
    else if (c === "list") addLog(`[INFO]: ${players}/20 игроков`);
    else if (cmd.startsWith("say ")) addLog(`[INFO]: [Server] ${cmd.slice(4)}`);
    else if (c.startsWith("install ")) {
      const core = cmd.slice(8).trim();
      addLog(`[ZetixHost] Скачивание ядра ${core}...`);
      setTimeout(() => addLog(`[ZetixHost] Установка ${core} завершена ✔`), 800);
      setTimeout(() => addLog(`[ZetixHost] Ядро ${core} успешно установлено и готово к запуску`), 1400);
    }
    else addLog(`[INFO]: Unknown command. Введите help для списка команд.`);
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
            <SettingsTab server={server} user={user} setUser={setUser} />
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
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    const accounts = getAccounts();
    const key = form.email.toLowerCase();
    if (mode === "register") {
      if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
      if (accounts[key]) { setError("Аккаунт с таким email уже существует"); return; }
      const u: UserState = { name: form.name || form.email.split("@")[0], email: form.email, password: form.password, balance: BONUS_ON_REGISTER, isAdmin: false, servers: [] };
      pushAdminLog({ time: nowStr(), msg: `🎁 Регистрация: ${u.email}`, type: "auth", authEmail: u.email, authPass: u.password });
      saveAccount(u);
      onSuccess(u);
    } else {
      const found = accounts[key];
      if (!found) { setError("Аккаунт не найден"); return; }
      if (found.password !== form.password) { setError("Неверный пароль"); return; }
      pushAdminLog({ time: nowStr(), msg: `🔑 Вход: ${found.email}`, type: "auth", authEmail: found.email, authPass: found.password });
      onSuccess(found);
    }
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

// ─── Account Storage ──────────────────────────────────────────────────────────
const STORAGE_KEY = "zetix_accounts";
const SESSION_KEY = "zetix_session";
function getAccounts(): Record<string, UserState> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveAccount(u: UserState) {
  const all = getAccounts(); all[u.email.toLowerCase()] = u;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  broadcastAccountUpdate(u);
}
function getSession(): UserState | null {
  try { const s = sessionStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

// ─── Cross-tab Storage Sync ────────────────────────────────────────────────
let storageListeners: ((u: UserState) => void)[] = [];
function useStorageSync(email: string | undefined, callback: (u: UserState) => void) {
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    if (!email) return;
    const fn = (u: UserState) => { if (u.email.toLowerCase() === email.toLowerCase()) cb.current(u); };
    storageListeners.push(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const all: Record<string, UserState> = JSON.parse(e.newValue || "{}");
        const updated = all[email.toLowerCase()];
        if (updated) cb.current(updated);
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      storageListeners = storageListeners.filter(f => f !== fn);
      window.removeEventListener("storage", onStorage);
    };
  }, [email]);
}
function broadcastAccountUpdate(u: UserState) {
  storageListeners.forEach(fn => fn(u));
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [user, setUser] = useState<UserState | null>(() => {
    const session = getSession();
    if (session) {
      const fresh = getAccounts()[session.email.toLowerCase()];
      return fresh || session;
    }
    return null;
  });
  const [activePanelServer, setActivePanelServer] = useState<ServerInfo | null>(null);
  const [panelView, setPanelView] = useState<"list" | "server">("list");


  // Global realtime logs
  useEffect(() => {
    const msgs = ["Heartbeat: все системы работают", "Мониторинг: нагрузка в норме", "Security: 0 угроз обнаружено", "Network: пинг 2ms", "Backup: автоматическое копирование выполнено"];
    const iv = setInterval(() => pushAdminLog({ time: nowStr(), msg: msgs[Math.floor(Math.random() * msgs.length)], type: "info" }), 8000);
    return () => clearInterval(iv);
  }, []);

  const handleBuyPlan = (plan: PlanAny) => {
    if (!user) { setAuthMode("register"); setPage("auth"); return; }
    if (user.servers.length >= MAX_SERVERS) { alert(`Максимум ${MAX_SERVERS} серверов на аккаунт`); return; }
    if (user.balance < (plan.price as number)) {
      alert(`Недостаточно средств. Ваш баланс: ${user.balance.toLocaleString("ru-RU")}₽, нужно: ${(plan.price as number).toLocaleString("ru-RU")}₽. Пополните баланс через поддержку @HellwayYT в Telegram.`);
      return;
    }
    handleConfirmPurchase(randId(), plan);
  };

  const handleConfirmPurchase = (id: string, plan: PlanAny) => {
    if (!user) return;
    const port = randPort();
    const newServer: ServerInfo = { plan, port, id, status: "offline" };
    const updated = { ...user, servers: [...user.servers, newServer], balance: user.balance - (plan.price as number) };
    setUser(updated);
    setActivePanelServer(newServer);
    setPanelView("server");
    setPage("panel");
    pushAdminLog({ time: nowStr(), msg: `Сервер ${plan.id} активирован для ${user.email} (порт ${port})`, type: "info" });
  };

  useEffect(() => {
    if (user) {
      saveAccount(user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const handleAuthSuccess = (u: UserState) => { setUser(u); setPage("home"); };
  const handleLogout = () => { setUser(null); setPage("home"); };

  useBalanceTopup(({ email, amount }) => {
    setUser(prev => {
      if (!prev || prev.email.toLowerCase() !== email.toLowerCase()) return prev;
      const updated = { ...prev, balance: prev.balance + amount };
      saveAccount(updated);
      return updated;
    });
  });

  useStorageSync(user?.email, (updated) => {
    setUser(updated);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  });

  if (page === "panel") {
    if (panelView === "server" && activePanelServer && user) {
      return <ServerPanel server={activePanelServer} user={user} setUser={setUser} onBack={() => setPanelView("list")} />;
    }
    if (user) {
      return <MyServersPage user={user} onOpenServer={s => { setActivePanelServer(s); setPanelView("server"); }} onBack={() => setPage("home")} onBuyMore={() => setPage("home")} />;
    }
  }

  if (page === "profile" && user) {
    return <ProfilePage user={user} setUser={setUser} onBack={() => setPage("home")} onConfirmPurchase={handleConfirmPurchase} onLogout={handleLogout} />;
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
    </div>
  );
}