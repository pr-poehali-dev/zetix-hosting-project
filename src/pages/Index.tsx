import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "home" | "auth" | "buy" | "panel";
type AuthMode = "login" | "register";
type ServiceTab = "game" | "vds" | "web";
type PanelTab = "console" | "files" | "settings";
type ServerStatus = "offline" | "starting" | "online" | "stopping";

interface PlanAny {
  id: string;
  price: number;
  cpu: string;
  ram: string;
  disk: string;
  net: string;
  [key: string]: string | number;
}

interface ServerFile {
  name: string;
  type: "file" | "folder";
  size?: string;
  ext?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const gamePlans: PlanAny[] = [
  { id: "GAME RU-1", price: 245, cpu: "2 vCPU (Intel Core i5-12500)", ram: "4 GB DDR5", disk: "24 GB NVMe", net: "1 Гбит/с", backups: 0, db: 1, flag: "🇷🇺", loc: "Россия" },
  { id: "GAME RU-2", price: 366, cpu: "3 vCPU (Intel Core i5-12500)", ram: "6 GB DDR5", disk: "32 GB NVMe", net: "1 Гбит/с", backups: 1, db: 1, flag: "🇷🇺", loc: "Россия" },
  { id: "GAME RU-3", price: 510, cpu: "4 vCPU (Intel Core i5-12500)", ram: "8 GB DDR5", disk: "48 GB NVMe", net: "1 Гбит/с", backups: 2, db: 2, flag: "🇷🇺", loc: "Россия" },
  { id: "GAME RU-4", price: 767, cpu: "6 vCPU (Intel Core i5-12500)", ram: "12 GB DDR5", disk: "56 GB NVMe", net: "1 Гбит/с", backups: 2, db: 2, flag: "🇷🇺", loc: "Россия" },
  { id: "GAME RU-5", price: 1027, cpu: "8 vCPU (Intel Core i5-12500)", ram: "16 GB DDR5", disk: "72 GB NVMe", net: "1 Гбит/с", backups: 3, db: 3, flag: "🇷🇺", loc: "Россия" },
];

const vdsPlans: PlanAny[] = [
  { id: "VDS DE-1", price: 249, cpu: "1 vCPU (AMD Ryzen 9 5950X)", ram: "2 GB", disk: "24 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited", flag: "🇩🇪", loc: "Германия" },
  { id: "VDS DE-2", price: 529, cpu: "2 vCPU (AMD Ryzen 9 5950X)", ram: "4 GB", disk: "48 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited", flag: "🇩🇪", loc: "Германия" },
  { id: "VDS DE-3", price: 949, cpu: "4 vCPU (AMD Ryzen 9 5950X)", ram: "8 GB", disk: "96 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited", flag: "🇩🇪", loc: "Германия" },
  { id: "VDS DE-4", price: 1649, cpu: "8 vCPU (AMD Ryzen 9 5950X)", ram: "16 GB", disk: "192 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited", flag: "🇩🇪", loc: "Германия" },
  { id: "VDS DE-5", price: 2899, cpu: "12 vCPU (AMD Ryzen 9 5950X)", ram: "32 GB", disk: "384 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited", flag: "🇩🇪", loc: "Германия" },
  { id: "VDS DE-6", price: 4199, cpu: "16 vCPU (AMD Ryzen 9 5950X)", ram: "48 GB", disk: "512 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited", flag: "🇩🇪", loc: "Германия" },
];

const DOLPHIN_URL = "https://cdn.poehali.dev/projects/dd998167-bb93-472a-9cea-24032a9ccac4/bucket/816df426-570b-4395-aabb-c7fa1ebf9392.png";

const defaultFiles: ServerFile[] = [
  { name: "server.jar", type: "file", size: "42.3 MB", ext: "jar" },
  { name: "server.properties", type: "file", size: "3.1 KB", ext: "properties" },
  { name: "plugins", type: "folder" },
  { name: "world", type: "folder" },
  { name: "eula.txt", type: "file", size: "0.2 KB", ext: "txt" },
  { name: "logs", type: "folder" },
];

const startupMessages = [
  "[00:00:01] [Server thread/INFO]: Starting minecraft server version 1.20.4",
  "[00:00:01] [Server thread/INFO]: Loading properties",
  "[00:00:01] [Server thread/INFO]: Default game type: SURVIVAL",
  "[00:00:02] [Server thread/INFO]: Generating keypair",
  "[00:00:02] [Server thread/INFO]: Starting Minecraft server on msk.zetixhost.me:25565",
  "[00:00:02] [Server thread/INFO]: Using epoll channel type",
  "[00:00:03] [Server thread/INFO]: Preparing level \"world\"",
  "[00:00:03] [Server thread/INFO]: Preparing start region for dimension minecraft:overworld",
  "[00:00:04] [Server thread/INFO]: Preparing spawn area: 0%",
  "[00:00:04] [Server thread/INFO]: Preparing spawn area: 12%",
  "[00:00:05] [Server thread/INFO]: Preparing spawn area: 24%",
  "[00:00:05] [Server thread/INFO]: Preparing spawn area: 48%",
  "[00:00:06] [Server thread/INFO]: Preparing spawn area: 71%",
  "[00:00:06] [Server thread/INFO]: Preparing spawn area: 95%",
  "[00:00:07] [Server thread/INFO]: Time elapsed: 4102 ms",
  "[00:00:07] [Server thread/INFO]: Done (6.234s)! For help, type \"help\"",
  "[00:00:07] [Server thread/INFO]: Starting remote control listener",
  "[00:00:07] [RCON Listener/INFO]: RCON running on 0.0.0.0:25575",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function SpecRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon name={icon} fallback="Circle" size={14} className="mt-0.5 shrink-0" style={{ color: "var(--z-muted)" }} />
      <div className="flex flex-col">
        <span style={{ color: "var(--z-muted)" }}>{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onAuthClick, onPanelClick, loggedIn }: { onAuthClick: () => void; onPanelClick: () => void; loggedIn: boolean }) {
  return (
    <nav style={{ background: "rgba(12,13,16,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--z-border)" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 8, width: 32, height: 32 }}
          className="flex items-center justify-center font-bold text-white text-sm">Z</div>
        <span className="font-bold text-white text-lg">ZetixHost</span>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--z-muted)" }}>
        <a href="#services" className="hover:text-white transition-colors">Услуги</a>
        <a href="#plans" className="hover:text-white transition-colors">Тарифы</a>
        <a href="#vds" className="hover:text-white transition-colors">VDS</a>
        {loggedIn && (
          <button onClick={onPanelClick} className="hover:text-white transition-colors" style={{ color: "var(--z-blue)" }}>
            Мои серверы
          </button>
        )}
      </div>
      {loggedIn ? (
        <button onClick={onPanelClick} className="z-btn-primary px-5 py-2 text-sm">
          <Icon name="LayoutDashboard" size={14} /> Панель
        </button>
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
        <div className="animate-fade-in">
          <p className="text-xl mb-2 font-medium" style={{ color: "var(--z-muted)" }}>Надежный</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            Хостинг, где<br />ваши идеи<br />обретают<br />жизнь
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--z-muted)" }}>
            Создавайте проекты и достигайте<br />недостижимого вместе с нами
          </p>
          <button onClick={onOrderClick} className="z-btn-primary px-7 py-3.5 text-base">
            <span>→</span> Заказать
          </button>
        </div>
        <div className="flex justify-center items-center">
          <img src={DOLPHIN_URL} alt="ZetixHost Mascot"
            className="animate-float w-72 md:w-[380px] object-contain"
            style={{ filter: "drop-shadow(0 0 50px rgba(0,180,255,0.25))" }} />
        </div>
      </div>
    </section>
  );
}

// ─── Plan Cards ───────────────────────────────────────────────────────────────
function GameCard({ plan, onBuy }: { plan: PlanAny; onBuy: (p: PlanAny) => void }) {
  return (
    <div className="z-card p-5 flex flex-col gap-4 hover:border-blue-500/50 transition-all cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Server" size={14} style={{ color: "var(--z-blue)" }} />
          <span className="font-semibold text-white text-sm">{plan.id}</span>
        </div>
        <span className="text-xs" style={{ color: "var(--z-muted)" }}>{plan.flag} {plan.loc}</span>
      </div>
      <div className="text-2xl font-bold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽
        <span className="text-sm font-normal ml-1" style={{ color: "var(--z-muted)" }}>/ мес.</span>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <SpecRow icon="Cpu" label="Процессор" value={plan.cpu as string} />
        <SpecRow icon="MemoryStick" label="Оперативная память" value={plan.ram as string} />
        <SpecRow icon="HardDrive" label="Хранилище" value={plan.disk as string} />
        <SpecRow icon="Wifi" label="Сеть" value={plan.net as string} />
        <SpecRow icon="RefreshCw" label="Резервные копии" value={String(plan.backups)} />
        <SpecRow icon="Database" label="Базы данных" value={String(plan.db)} />
      </div>
      <button onClick={() => onBuy(plan)} className="z-btn-primary w-full py-2.5 justify-center text-sm mt-auto">
        <Icon name="ShoppingCart" size={14} /> Перейти к покупке →
      </button>
    </div>
  );
}

function VdsCard({ plan, onBuy }: { plan: PlanAny; onBuy: (p: PlanAny) => void }) {
  return (
    <div className="z-card p-5 flex flex-col gap-4 hover:border-blue-500/50 transition-all cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Server" size={14} style={{ color: "var(--z-blue)" }} />
          <span className="font-semibold text-white text-sm">{plan.id}</span>
        </div>
        <span className="text-xs" style={{ color: "var(--z-muted)" }}>{plan.flag} {plan.loc}</span>
      </div>
      <div className="text-2xl font-bold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽
        <span className="text-sm font-normal ml-1" style={{ color: "var(--z-muted)" }}>/ мес.</span>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <SpecRow icon="Cpu" label="Процессор" value={plan.cpu as string} />
        <SpecRow icon="MemoryStick" label="Оперативная память" value={plan.ram as string} />
        <SpecRow icon="HardDrive" label="Хранилище" value={plan.disk as string} />
        <SpecRow icon="Wifi" label="Сеть" value={plan.net as string} />
        <SpecRow icon="Shield" label="Защита DDoS" value={plan.ddos as string} />
        <div className="flex items-start gap-2 text-sm">
          <Icon name="Globe" size={14} className="mt-0.5 shrink-0" style={{ color: "var(--z-muted)" }} />
          <div className="flex flex-col">
            <span style={{ color: "var(--z-muted)" }}>Провайдер</span>
            <span style={{ color: "var(--z-blue)" }}>{plan.provider as string}</span>
          </div>
        </div>
      </div>
      <button onClick={() => onBuy(plan)} className="z-btn-primary w-full py-2.5 justify-center text-sm mt-auto">
        <Icon name="ShoppingCart" size={14} /> Перейти к покупке →
      </button>
    </div>
  );
}

// ─── Services Section ─────────────────────────────────────────────────────────
function ServicesSection({ onBuy }: { onBuy: (p: PlanAny) => void }) {
  const [activeTab, setActiveTab] = useState<ServiceTab>("game");

  const tabs = [
    { key: "game" as ServiceTab, icon: "Gamepad2", label: "Игровые серверы" },
    { key: "vds" as ServiceTab, icon: "Server", label: "Виртуальные серверы" },
    { key: "web" as ServiceTab, icon: "Globe", label: "Веб серверы" },
  ];

  return (
    <section id="services" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-3">Наши сервисы</h2>
        <p className="text-center mb-10" style={{ color: "var(--z-blue)" }}>Выберите подходящий тариф</p>
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={activeTab === t.key
                ? { background: "var(--z-card2)", border: "1px solid var(--z-border)", color: "white" }
                : { color: "var(--z-muted)", border: "1px solid transparent" }}>
              <Icon name={t.icon} fallback="Circle" size={14} />
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === "game" && (
          <div id="plans" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gamePlans.map((p) => <GameCard key={p.id} plan={p} onBuy={onBuy} />)}
          </div>
        )}
        {activeTab === "vds" && (
          <div id="vds" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vdsPlans.map((p) => <VdsCard key={p.id} plan={p} onBuy={onBuy} />)}
          </div>
        )}
        {activeTab === "web" && (
          <div className="text-center py-20" style={{ color: "var(--z-muted)" }}>
            <Icon name="Globe" size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Веб-серверы скоро появятся</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Buy Modal ────────────────────────────────────────────────────────────────
function BuyModal({ plan, onClose, onSuccess }: { plan: PlanAny; onClose: () => void; onSuccess: () => void }) {
  const [card, setCard] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "done">("form");

  const handleExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    setExpiry(d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
        <div className="z-card p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(0,180,255,0.15)", border: "2px solid var(--z-blue)" }}>
            <Icon name="CheckCircle" size={32} style={{ color: "var(--z-blue)" }} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Оплата прошла успешно!</h3>
          <p className="mb-1" style={{ color: "var(--z-muted)" }}>Тариф <span className="text-white font-semibold">{plan.id}</span> активирован</p>
          <p className="text-sm mb-6" style={{ color: "var(--z-muted)" }}>Сервер <span style={{ color: "var(--z-blue)" }}>msk.zetixhost.me</span> готов к запуску</p>
          <div className="z-card2 p-4 rounded-xl mb-6 text-left text-sm">
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--z-muted)" }}>Тариф</span>
              <span className="text-white">{plan.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--z-muted)" }}>Процессор</span>
              <span className="text-white">{plan.cpu as string}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--z-muted)" }}>Память</span>
              <span className="text-white">{plan.ram as string}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--z-muted)" }}>Хранилище</span>
              <span className="text-white">{plan.disk as string}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--z-muted)" }}>IP сервера</span>
              <span style={{ color: "var(--z-blue)" }}>msk.zetixhost.me</span>
            </div>
          </div>
          <button onClick={onSuccess} className="z-btn-primary w-full py-3 justify-center text-sm">
            <Icon name="LayoutDashboard" size={14} /> Открыть панель управления
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="z-card p-7 max-w-md w-full animate-scale-in" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Оплата тарифа</h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--z-blue)" }}>{plan.id} — {(plan.price as number).toLocaleString("ru-RU")}₽/мес.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
            <Icon name="X" size={16} style={{ color: "var(--z-muted)" }} />
          </button>
        </div>

        {/* Payment info */}
        <div className="z-card2 p-3 rounded-xl mb-5 text-sm" style={{ borderColor: "rgba(0,180,255,0.2)" }}>
          <p className="font-medium text-white mb-1">Реквизиты для оплаты:</p>
          <p style={{ color: "var(--z-muted)" }}>📞 Телефон: <span className="text-white">+7 921 700-61-74</span></p>
          <p style={{ color: "var(--z-muted)" }}>💳 Карта: <span className="text-white font-mono">2202 2082 8801 8451</span></p>
        </div>

        <form onSubmit={handlePay} className="flex flex-col gap-4">
          {/* Card visual */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a2040 0%, #0d1230 100%)", border: "1px solid rgba(0,180,255,0.25)" }}>
            <div className="flex justify-between items-start mb-6">
              <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 6, width: 28, height: 28 }}
                className="flex items-center justify-center font-bold text-white text-xs">Z</div>
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>VISA / MC</span>
            </div>
            <p className="font-mono text-xl text-white tracking-widest mb-4">
              {card || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span className="uppercase">{name || "ВЛАДЕЛЕЦ"}</span>
              <span>{expiry || "MM/YY"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Номер карты</label>
            <input className="z-input font-mono tracking-widest" placeholder="0000 0000 0000 0000"
              value={card} onChange={(e) => setCard(formatCard(e.target.value))} required maxLength={19} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Имя владельца</label>
            <input className="z-input uppercase" placeholder="IVAN PETROV"
              value={name} onChange={(e) => setName(e.target.value.toUpperCase())} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Срок действия</label>
              <input className="z-input" placeholder="MM/YY"
                value={expiry} onChange={(e) => handleExpiry(e.target.value)} required maxLength={5} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>CVV</label>
              <input className="z-input" placeholder="•••" type="password"
                value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} required maxLength={3} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--z-border)" }}>
            <span style={{ color: "var(--z-muted)" }}>Итого:</span>
            <span className="text-xl font-bold text-white">{(plan.price as number).toLocaleString("ru-RU")}₽</span>
          </div>
          <button type="submit" disabled={loading} className="z-btn-primary w-full py-3.5 justify-center text-base">
            {loading ? (
              <span className="flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" /> Обработка...</span>
            ) : (
              <span className="flex items-center gap-2"><Icon name="CreditCard" size={16} /> Оплатить {(plan.price as number).toLocaleString("ru-RU")}₽</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Server Panel ─────────────────────────────────────────────────────────────
function ServerPanel({ plan, onBack }: { plan: PlanAny; onBack: () => void }) {
  const [tab, setTab] = useState<PanelTab>("console");
  const [status, setStatus] = useState<ServerStatus>("offline");
  const [logs, setLogs] = useState<string[]>(["[ZetixHost] Сервер остановлен. Нажмите Старт для запуска."]);
  const [cmd, setCmd] = useState("");
  const [files, setFiles] = useState<ServerFile[]>(defaultFiles);
  const [selectedFile, setSelectedFile] = useState<ServerFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [serverProps, setServerProps] = useState(
    `server-name=ZetixHost Server\nmotd=\\u00A7aWelcome to ZetixHost!\nserver-port=25565\ngamemode=survival\ndifficulty=normal\nmax-players=20\nonline-mode=true\nwhite-list=false\nspawn-protection=16\nview-distance=10\nsimulation-distance=10\nip=msk.zetixhost.me`
  );
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const startServer = useCallback(() => {
    if (status === "online" || status === "starting") return;
    setStatus("starting");
    msgIndexRef.current = 0;
    addLog("[ZetixHost] Запуск сервера...");
    timerRef.current = setInterval(() => {
      if (msgIndexRef.current < startupMessages.length) {
        addLog(startupMessages[msgIndexRef.current]);
        msgIndexRef.current++;
      } else {
        setStatus("online");
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 180);
  }, [status, addLog]);

  const stopServer = useCallback(() => {
    if (status !== "online") return;
    setStatus("stopping");
    addLog("[Server thread/INFO]: Stopping the server");
    addLog("[Server thread/INFO]: Saving players");
    addLog("[Server thread/INFO]: Saving worlds");
    setTimeout(() => {
      addLog("[ZetixHost] Сервер остановлен.");
      setStatus("offline");
    }, 1500);
  }, [status, addLog]);

  const restartServer = useCallback(() => {
    stopServer();
    setTimeout(() => startServer(), 2500);
  }, [stopServer, startServer]);

  const sendCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    addLog(`> ${cmd}`);
    if (cmd === "help") addLog("[Server thread/INFO]: Available commands: help, list, stop, say, time, weather");
    else if (cmd === "list") addLog("[Server thread/INFO]: There are 0/20 players online:");
    else if (cmd.startsWith("say ")) addLog(`[Server thread/INFO]: [Server] ${cmd.slice(4)}`);
    else addLog(`[Server thread/INFO]: Unknown command. Type "help" for help.`);
    setCmd("");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setTimeout(() => {
      const ext = f.name.split(".").pop() || "";
      setFiles((prev) => [...prev, { name: f.name, type: "file", size: `${(f.size / 1024).toFixed(1)} KB`, ext }]);
      setUploading(false);
    }, 1200);
    e.target.value = "";
  };

  const openFile = (file: ServerFile) => {
    if (file.type === "folder") return;
    setSelectedFile(file);
    if (file.name === "server.properties") setFileContent(serverProps);
    else if (file.ext === "txt") setFileContent("eula=true");
    else setFileContent(`# Файл: ${file.name}\n# Бинарный файл (${file.size})`);
  };

  const saveFile = () => {
    if (selectedFile?.name === "server.properties") setServerProps(fileContent);
    addLog(`[ZetixHost] Файл ${selectedFile?.name} сохранён`);
    setSelectedFile(null);
  };

  const deleteFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    if (selectedFile?.name === name) setSelectedFile(null);
  };

  const statusColors: Record<ServerStatus, string> = {
    offline: "#ef4444",
    starting: "#f59e0b",
    online: "#22c55e",
    stopping: "#f59e0b",
  };
  const statusLabels: Record<ServerStatus, string> = {
    offline: "Остановлен",
    starting: "Запускается...",
    online: "Работает",
    stopping: "Останавливается...",
  };

  const sideItems = [
    { key: "console" as PanelTab, icon: "Terminal", label: "Консоль" },
    { key: "files" as PanelTab, icon: "FolderOpen", label: "Файлы" },
    { key: "settings" as PanelTab, icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--z-bg)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm hover:text-white transition-colors" style={{ color: "var(--z-muted)" }}>
            <Icon name="ArrowLeft" size={14} /> Главная
          </button>
          <span style={{ color: "var(--z-border)" }}>|</span>
          <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 6, width: 24, height: 24 }}
            className="flex items-center justify-center font-bold text-white text-xs">Z</div>
          <span className="font-bold text-white">ZetixHost</span>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: "var(--z-card2)", color: "var(--z-muted)", fontSize: 11 }}>
            {plan.id}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ background: statusColors[status], boxShadow: `0 0 6px ${statusColors[status]}` }} />
            <span style={{ color: "var(--z-muted)" }}>{statusLabels[status]}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startServer} disabled={status !== "offline"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={status === "offline" ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" } : { background: "var(--z-card2)", color: "var(--z-muted)", border: "1px solid var(--z-border)", opacity: 0.5 }}>
              <Icon name="Play" size={12} /> Старт
            </button>
            <button onClick={stopServer} disabled={status !== "online"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={status === "online" ? { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" } : { background: "var(--z-card2)", color: "var(--z-muted)", border: "1px solid var(--z-border)", opacity: 0.5 }}>
              <Icon name="Square" size={12} /> Стоп
            </button>
            <button onClick={restartServer} disabled={status !== "online"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={status === "online" ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" } : { background: "var(--z-card2)", color: "var(--z-muted)", border: "1px solid var(--z-border)", opacity: 0.5 }}>
              <Icon name="RotateCw" size={12} /> Рестарт
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <aside className="w-56 flex flex-col border-r" style={{ background: "var(--z-card)", borderColor: "var(--z-border)" }}>
          {/* Dolphin hero */}
          <div className="p-4 border-b flex flex-col items-center" style={{ borderColor: "var(--z-border)", background: "linear-gradient(180deg, rgba(0,90,160,0.15) 0%, transparent 100%)" }}>
            <img src={DOLPHIN_URL} alt="mascot" className="w-24 object-contain animate-float" style={{ filter: "drop-shadow(0 0 16px rgba(0,180,255,0.35))" }} />
            <p className="text-xs mt-1 font-semibold" style={{ color: "var(--z-blue)" }}>ZetixHost</p>
            <p className="text-xs" style={{ color: "var(--z-muted)" }}>msk.zetixhost.me</p>
          </div>

          {/* Nav */}
          <nav className="flex flex-col p-2 gap-0.5">
            {sideItems.map((item) => (
              <button key={item.key} onClick={() => setTab(item.key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                style={tab === item.key
                  ? { background: "rgba(0,180,255,0.12)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }
                  : { color: "var(--z-muted)", border: "1px solid transparent" }}>
                <Icon name={item.icon} fallback="Circle" size={15} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Server info */}
          <div className="mt-auto p-3 m-2 rounded-xl text-xs" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
            <p className="font-semibold text-white mb-2">Параметры</p>
            <div className="flex flex-col gap-1" style={{ color: "var(--z-muted)" }}>
              <div className="flex justify-between"><span>CPU</span><span className="text-white">{plan.cpu as string}</span></div>
              <div className="flex justify-between"><span>RAM</span><span className="text-white">{plan.ram as string}</span></div>
              <div className="flex justify-between"><span>Диск</span><span className="text-white">{plan.disk as string}</span></div>
              <div className="flex justify-between"><span>Сеть</span><span className="text-white">{plan.net as string}</span></div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Console */}
          {tab === "console" && (
            <div className="flex flex-col h-full">
              <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--z-border)" }}>
                <Icon name="Terminal" size={16} style={{ color: "var(--z-blue)" }} />
                <span className="font-semibold text-white text-sm">Консоль</span>
                <span className="ml-auto text-xs font-mono" style={{ color: "var(--z-muted)" }}>msk.zetixhost.me:25565</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed" style={{ background: "#080a0e" }}>
                {logs.map((l, i) => (
                  <div key={i} className="mb-0.5"
                    style={{ color: l.startsWith(">") ? "#00b4ff" : l.includes("ERROR") ? "#ef4444" : l.includes("Done") ? "#22c55e" : l.includes("WARN") ? "#f59e0b" : "#a8b0c0" }}>
                    {l}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
              <form onSubmit={sendCmd} className="flex gap-2 p-3 border-t" style={{ borderColor: "var(--z-border)", background: "var(--z-card)" }}>
                <span className="font-mono text-sm self-center" style={{ color: "var(--z-blue)" }}>&gt;</span>
                <input className="flex-1 bg-transparent outline-none text-sm font-mono text-white placeholder:text-gray-600"
                  placeholder={status === "online" ? "Введите команду..." : "Сервер остановлен"}
                  value={cmd} onChange={(e) => setCmd(e.target.value)} disabled={status !== "online"} />
                <button type="submit" disabled={status !== "online"} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(0,180,255,0.15)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
                  <Icon name="Send" size={12} />
                </button>
              </form>
            </div>
          )}

          {/* Files */}
          {tab === "files" && (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-72 border-r flex flex-col" style={{ borderColor: "var(--z-border)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--z-border)" }}>
                  <div className="flex items-center gap-2">
                    <Icon name="FolderOpen" size={15} style={{ color: "var(--z-blue)" }} />
                    <span className="font-semibold text-white text-sm">Файлы сервера</span>
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                    style={{ background: "rgba(0,180,255,0.12)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
                    {uploading ? <Icon name="Loader2" size={11} className="animate-spin" /> : <Icon name="Upload" size={11} />}
                    Загрузить
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".jar,.yml,.yaml,.txt,.properties,.json,.jpg,.png,.zip" onChange={handleUpload} />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {files.map((f) => (
                    <div key={f.name} onClick={() => openFile(f)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-all"
                      style={selectedFile?.name === f.name
                        ? { background: "rgba(0,180,255,0.1)", border: "1px solid rgba(0,180,255,0.2)" }
                        : { border: "1px solid transparent" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name={f.type === "folder" ? "Folder" : f.ext === "jar" ? "Package" : "FileText"} fallback="File" size={14}
                          style={{ color: f.type === "folder" ? "#f59e0b" : f.ext === "jar" ? "#a78bfa" : "var(--z-muted)", flexShrink: 0 }} />
                        <span className="text-sm truncate" style={{ color: selectedFile?.name === f.name ? "white" : "var(--z-text)" }}>{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        {f.size && <span className="text-xs" style={{ color: "var(--z-muted)" }}>{f.size}</span>}
                        <button onClick={(e) => { e.stopPropagation(); deleteFile(f.name); }}
                          className="p-0.5 rounded hover:bg-red-500/20 transition-colors">
                          <Icon name="Trash2" size={11} style={{ color: "#ef4444" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File viewer */}
              <div className="flex-1 flex flex-col">
                {selectedFile ? (
                  <>
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--z-border)" }}>
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" size={14} style={{ color: "var(--z-blue)" }} />
                        <span className="font-semibold text-white text-sm">{selectedFile.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveFile} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(0,180,255,0.12)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
                          <Icon name="Save" size={11} /> Сохранить
                        </button>
                        <button onClick={() => setSelectedFile(null)} className="text-xs px-2 py-1.5 rounded-lg"
                          style={{ color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
                          <Icon name="X" size={11} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="flex-1 p-4 font-mono text-sm resize-none outline-none"
                      style={{ background: "#080a0e", color: "#a8b8c8", lineHeight: 1.7 }}
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      spellCheck={false}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--z-muted)" }}>
                    <Icon name="FileText" size={48} className="opacity-20" />
                    <p>Выберите файл для просмотра</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === "settings" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-white mb-1">Настройки сервера</h3>
                <p className="text-sm mb-6" style={{ color: "var(--z-muted)" }}>Конфигурация server.properties</p>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { key: "server-name", label: "Название сервера", value: "ZetixHost Server" },
                    { key: "motd", label: "MOTD (описание)", value: "Welcome to ZetixHost!" },
                    { key: "server-port", label: "Порт", value: "25565" },
                    { key: "gamemode", label: "Режим игры", value: "survival" },
                    { key: "difficulty", label: "Сложность", value: "normal" },
                    { key: "max-players", label: "Макс. игроков", value: "20" },
                    { key: "ip", label: "IP адрес сервера", value: "msk.zetixhost.me" },
                    { key: "view-distance", label: "Дальность прорисовки", value: "10" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                      <div className="flex-1">
                        <label className="text-xs block mb-1" style={{ color: "var(--z-muted)" }}>{item.label}</label>
                        <input className="z-input text-sm py-2" defaultValue={item.value} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl" style={{ background: "var(--z-card2)", border: "1px solid var(--z-border)" }}>
                  <p className="text-xs font-semibold text-white mb-2">IP адрес для подключения</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--z-card)", border: "1px solid rgba(0,180,255,0.2)" }}>
                    <Icon name="Globe" size={16} style={{ color: "var(--z-blue)" }} />
                    <span className="font-mono text-sm" style={{ color: "var(--z-blue)" }}>msk.zetixhost.me:25565</span>
                    <button onClick={() => navigator.clipboard.writeText("msk.zetixhost.me:25565")}
                      className="ml-auto text-xs px-2 py-1 rounded" style={{ color: "var(--z-muted)", border: "1px solid var(--z-border)" }}>
                      <Icon name="Copy" size={11} />
                    </button>
                  </div>
                </div>

                <button className="z-btn-primary mt-4 px-6 py-2.5 text-sm justify-center">
                  <Icon name="Save" size={14} /> Сохранить настройки
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ mode, setMode, onBack, onSuccess }: { mode: AuthMode; setMode: (m: AuthMode) => void; onBack: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", name: "", confirm: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--z-bg)" }}>
      <div className="hidden md:flex flex-1 flex-col justify-center px-16">
        <h2 className="text-4xl font-bold text-white mb-2">{mode === "login" ? "С возвращением" : "Добро пожаловать"}</h2>
        <p className="text-4xl font-bold" style={{ color: "var(--z-blue)" }}>в Zetix</p>
        <button onClick={onBack} className="flex items-center gap-2 mt-12 text-sm hover:text-white transition-colors" style={{ color: "var(--z-muted)" }}>
          <Icon name="ArrowLeft" size={14} /> На главную
        </button>
      </div>
      <div className="flex-1 md:flex-none md:w-[480px] flex items-center justify-center p-6">
        <div className="w-full max-w-sm z-card p-8" style={{ boxShadow: "0 0 60px rgba(0,180,255,0.08)" }}>
          <div className="flex justify-center mb-6">
            <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 10, width: 44, height: 44 }}
              className="flex items-center justify-center font-bold text-white text-xl">Z</div>
          </div>
          <h3 className="text-center text-white font-semibold text-lg mb-6">
            {mode === "login" ? "Вход по почте и паролю" : "Регистрация аккаунта"}
          </h3>
          {error && <div className="mb-4 p-3 rounded-lg text-sm text-center" style={{ background: "rgba(255,60,60,0.1)", color: "#ff6060", border: "1px solid rgba(255,60,60,0.2)" }}>{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Имя пользователя</label>
                <input className="z-input" type="text" placeholder="Введите имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Почта</label>
              <input className="z-input" type="email" placeholder="Введите email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: "var(--z-muted)" }}>Пароль</label>
                {mode === "login" && <a href="#" className="text-xs" style={{ color: "var(--z-blue)" }}>Забыли пароль?</a>}
              </div>
              <input className="z-input" type="password" placeholder="Введите пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Подтверждение пароля</label>
                <input className="z-input" type="password" placeholder="Повторите пароль" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              </div>
            )}
            {mode === "login" && (
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--z-muted)" }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-blue-500" />
                Запомнить меня
              </label>
            )}
            <button type="submit" disabled={loading} className="z-btn-primary w-full py-3 justify-center text-sm mt-1">
              {loading ? "..." : mode === "login" ? "→  Войти" : "→  Зарегистрироваться"}
            </button>
            {mode === "login" && (
              <>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--z-muted)" }}>
                  <div className="flex-1 h-px" style={{ background: "var(--z-border)" }} /> или <div className="flex-1 h-px" style={{ background: "var(--z-border)" }} />
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
      <div className="flex items-center justify-center gap-2 mb-3">
        <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 6, width: 24, height: 24 }}
          className="flex items-center justify-center font-bold text-white text-xs">Z</div>
        <span className="font-semibold text-white">ZetixHost</span>
      </div>
      <p>© 2024 ZetixHost. Все права защищены.</p>
    </footer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanAny | null>(null);
  const [boughtPlan, setBoughtPlan] = useState<PlanAny | null>(null);

  const handleBuyClick = (plan: PlanAny) => {
    if (!loggedIn) {
      setAuthMode("register");
      setPage("auth");
      setSelectedPlan(plan);
    } else {
      setSelectedPlan(plan);
    }
  };

  const handleAuthSuccess = () => {
    setLoggedIn(true);
    if (selectedPlan) {
      setPage("home");
    } else {
      setPage("home");
    }
  };

  const handlePurchaseSuccess = () => {
    if (selectedPlan) {
      setBoughtPlan(selectedPlan);
      setSelectedPlan(null);
      setPage("panel");
    }
  };

  if (page === "panel" && boughtPlan) {
    return <ServerPanel plan={boughtPlan} onBack={() => setPage("home")} />;
  }

  if (page === "auth") {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onBack={() => setPage("home")}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div style={{ background: "var(--z-bg)", minHeight: "100vh" }}>
      <Navbar
        onAuthClick={() => { setAuthMode("login"); setPage("auth"); }}
        onPanelClick={() => boughtPlan && setPage("panel")}
        loggedIn={loggedIn}
      />
      <HeroSection onOrderClick={() => { setAuthMode("register"); setPage("auth"); }} />
      <ServicesSection onBuy={handleBuyClick} />
      <Footer />

      {/* Buy Modal */}
      {selectedPlan && loggedIn && (
        <BuyModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}
