import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────
type Page = "home" | "auth";
type AuthMode = "login" | "register";
type ServiceTab = "game" | "vds" | "web";

// ─── Data ─────────────────────────────────────────────────────────────────────
const gamePlans = [
  { id: "GAME RU-1", price: 245, cpu: "2 vCPU (Intel Core i5-12500)", ram: "4 GB DDR5", disk: "24 GB NVMe", net: "1 Гбит/с", backups: 0, db: 1 },
  { id: "GAME RU-2", price: 366, cpu: "3 vCPU (Intel Core i5-12500)", ram: "6 GB DDR5", disk: "32 GB NVMe", net: "1 Гбит/с", backups: 1, db: 1 },
  { id: "GAME RU-3", price: 510, cpu: "4 vCPU (Intel Core i5-12500)", ram: "8 GB DDR5", disk: "48 GB NVMe", net: "1 Гбит/с", backups: 2, db: 2 },
  { id: "GAME RU-4", price: 767, cpu: "6 vCPU (Intel Core i5-12500)", ram: "12 GB DDR5", disk: "56 GB NVMe", net: "1 Гбит/с", backups: 2, db: 2 },
  { id: "GAME RU-5", price: 1027, cpu: "8 vCPU (Intel Core i5-12500)", ram: "16 GB DDR5", disk: "72 GB NVMe", net: "1 Гбит/с", backups: 3, db: 3 },
];

const vdsPlans = [
  { id: "VDS DE-1", price: 249, cpu: "1 vCPU (AMD Ryzen 9 5950X)", ram: "2 GB", disk: "24 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited" },
  { id: "VDS DE-2", price: 529, cpu: "2 vCPU (AMD Ryzen 9 5950X)", ram: "4 GB", disk: "48 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited" },
  { id: "VDS DE-3", price: 949, cpu: "4 vCPU (AMD Ryzen 9 5950X)", ram: "8 GB", disk: "96 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited" },
  { id: "VDS DE-4", price: 1649, cpu: "8 vCPU (AMD Ryzen 9 5950X)", ram: "16 GB", disk: "192 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited" },
  { id: "VDS DE-5", price: 2899, cpu: "12 vCPU (AMD Ryzen 9 5950X)", ram: "32 GB", disk: "384 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited" },
  { id: "VDS DE-6", price: 4199, cpu: "16 vCPU (AMD Ryzen 9 5950X)", ram: "48 GB", disk: "512 GB NVMe SSD", net: "500 Мбит/с", ddos: "L4/7", provider: "Zetix Networks Limited" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function Navbar({ onAuthClick }: { onAuthClick: () => void }) {
  return (
    <nav style={{ background: "rgba(12,13,16,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--z-border)" }}
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
      </div>
      <button onClick={onAuthClick} className="z-btn-primary px-5 py-2 text-sm">
        Войти
      </button>
    </nav>
  );
}

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
          <img
            src="https://cdn.poehali.dev/projects/dd998167-bb93-472a-9cea-24032a9ccac4/files/d2dd50fc-37ed-44f0-9990-1124b7121cf9.jpg"
            alt="ZetixHost Mascot"
            className="animate-float w-80 md:w-96 object-contain drop-shadow-2xl"
            style={{ filter: "drop-shadow(0 0 40px rgba(0,180,255,0.2))" }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Game Plan Card ───────────────────────────────────────────────────────────
function GameCard({ plan, onBuy }: { plan: typeof gamePlans[0]; onBuy: () => void }) {
  return (
    <div className="z-card p-5 flex flex-col gap-4 hover:border-blue-500 transition-colors" style={{ borderColor: "var(--z-border)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Server" size={14} style={{ color: "var(--z-blue)" }} />
          <span className="font-semibold text-white text-sm">{plan.id}</span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--z-muted)" }}>
          🇷🇺 <span>Россия</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{plan.price.toLocaleString("ru-RU")}₽ <span className="text-sm font-normal" style={{ color: "var(--z-muted)" }}>/ мес.</span></div>
      <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--z-muted)" }}>
        <SpecRow icon="Cpu" label="Процессор" value={plan.cpu} />
        <SpecRow icon="MemoryStick" label="Оперативная память" value={plan.ram} />
        <SpecRow icon="HardDrive" label="Хранилище" value={plan.disk} />
        <SpecRow icon="Wifi" label="Сеть" value={plan.net} />
        <SpecRow icon="RefreshCw" label="Резервные копии" value={String(plan.backups)} />
        <SpecRow icon="Database" label="Базы данных" value={String(plan.db)} />
      </div>
      <button onClick={onBuy} className="z-btn-primary w-full py-2.5 justify-center text-sm mt-auto">
        <Icon name="ShoppingCart" size={14} /> Перейти к покупке →
      </button>
    </div>
  );
}

// ─── VDS Plan Card ────────────────────────────────────────────────────────────
function VdsCard({ plan, onBuy }: { plan: typeof vdsPlans[0]; onBuy: () => void }) {
  return (
    <div className="z-card p-5 flex flex-col gap-4 hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Server" size={14} style={{ color: "var(--z-blue)" }} />
          <span className="font-semibold text-white text-sm">{plan.id}</span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--z-muted)" }}>
          🇩🇪 <span>Германия</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{plan.price.toLocaleString("ru-RU")}₽ <span className="text-sm font-normal" style={{ color: "var(--z-muted)" }}>/ мес.</span></div>
      <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--z-muted)" }}>
        <SpecRow icon="Cpu" label="Процессор" value={plan.cpu} />
        <SpecRow icon="MemoryStick" label="Оперативная память" value={plan.ram} />
        <SpecRow icon="HardDrive" label="Хранилище" value={plan.disk} />
        <SpecRow icon="Wifi" label="Сеть" value={plan.net} />
        <SpecRow icon="Shield" label="Защита DDoS" value={plan.ddos} />
        <div className="flex items-start gap-2">
          <Icon name="Globe" size={14} className="mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span>Провайдер</span>
            <span style={{ color: "var(--z-blue)" }}>{plan.provider}</span>
          </div>
        </div>
      </div>
      <button onClick={onBuy} className="z-btn-primary w-full py-2.5 justify-center text-sm mt-auto">
        <Icon name="ShoppingCart" size={14} /> Перейти к покупке →
      </button>
    </div>
  );
}

function SpecRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon name={icon} fallback="Circle" size={14} className="mt-0.5 shrink-0" />
      <div className="flex flex-col">
        <span>{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
    </div>
  );
}

// ─── Services Section ─────────────────────────────────────────────────────────
function ServicesSection({ onBuy }: { onBuy: () => void }) {
  const [activeTab, setActiveTab] = useState<ServiceTab>("game");

  const tabs: { key: ServiceTab; icon: string; label: string }[] = [
    { key: "game", icon: "Gamepad2", label: "Игровые серверы" },
    { key: "vds", icon: "Server", label: "Виртуальные серверы" },
    { key: "web", icon: "Globe", label: "Веб серверы" },
  ];

  return (
    <section id="services" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-3">Наши сервисы</h2>
        <p className="text-center mb-10 text-base" style={{ color: "var(--z-blue)" }}>Выберите подходящий тариф</p>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === t.key ? "z-tab-active" : "z-tab"}`}
              style={activeTab === t.key ? { background: "var(--z-card2)", border: "1px solid var(--z-border)", color: "white" } : { color: "var(--z-muted)" }}>
              <Icon name={t.icon} fallback="Circle" size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "game" && (
          <div id="plans">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamePlans.map((p) => <GameCard key={p.id} plan={p} onBuy={onBuy} />)}
            </div>
          </div>
        )}

        {activeTab === "vds" && (
          <div id="vds">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vdsPlans.map((p) => <VdsCard key={p.id} plan={p} onBuy={onBuy} />)}
            </div>
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

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ mode, setMode, onBack }: { mode: AuthMode; setMode: (m: AuthMode) => void; onBack: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", name: "", confirm: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && form.password !== form.confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      if (mode === "register") {
        setSuccess("Аккаунт создан! Теперь вы можете войти.");
        setMode("login");
      } else {
        setSuccess("Добро пожаловать в ZetixHost!");
      }
    } catch {
      setError("Произошла ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--z-bg)" }}>
      {/* Left */}
      <div className="hidden md:flex flex-1 flex-col justify-center px-16">
        <h2 className="text-4xl font-bold text-white mb-2">
          {mode === "login" ? "С возвращением" : "Добро пожаловать"}
        </h2>
        <p className="text-4xl font-bold" style={{ color: "var(--z-blue)" }}>в Zetix</p>
        <button onClick={onBack} className="flex items-center gap-2 mt-12 text-sm transition-colors hover:text-white" style={{ color: "var(--z-muted)" }}>
          <Icon name="ArrowLeft" size={14} /> На главную
        </button>
      </div>

      {/* Right */}
      <div className="flex-1 md:flex-none md:w-[480px] flex items-center justify-center p-6">
        <div className="w-full max-w-sm z-card p-8" style={{ boxShadow: "0 0 60px rgba(0,180,255,0.08)" }}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div style={{ background: "linear-gradient(135deg,#00b4ff,#0060a0)", borderRadius: 10, width: 44, height: 44 }}
              className="flex items-center justify-center font-bold text-white text-xl">Z</div>
          </div>

          <h3 className="text-center text-white font-semibold text-lg mb-6">
            {mode === "login" ? "Вход по почте и паролю" : "Регистрация аккаунта"}
          </h3>

          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm text-center" style={{ background: "rgba(0,180,255,0.1)", color: "var(--z-blue)", border: "1px solid rgba(0,180,255,0.2)" }}>
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-center" style={{ background: "rgba(255,60,60,0.1)", color: "#ff6060", border: "1px solid rgba(255,60,60,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Имя пользователя</label>
                <input className="z-input" type="text" placeholder="Введите имя" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Почта</label>
              <input className="z-input" type="email" placeholder="Введите email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: "var(--z-muted)" }}>Пароль</label>
                {mode === "login" && <a href="#" className="text-xs" style={{ color: "var(--z-blue)" }}>Забыли пароль?</a>}
              </div>
              <input className="z-input" type="password" placeholder="Введите пароль" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--z-muted)" }}>Подтверждение пароля</label>
                <input className="z-input" type="password" placeholder="Повторите пароль" value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
              </div>
            )}
            {mode === "login" && (
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--z-muted)" }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                  className="rounded accent-blue-500" />
                Запомнить меня
              </label>
            )}

            <button type="submit" disabled={loading} className="z-btn-primary w-full py-3 justify-center text-sm mt-1">
              {loading ? "..." : mode === "login" ? "→  Войти" : "→  Зарегистрироваться"}
            </button>

            {mode === "login" && (
              <>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--z-muted)" }}>
                  <div className="flex-1 h-px" style={{ background: "var(--z-border)" }} />
                  или
                  <div className="flex-1 h-px" style={{ background: "var(--z-border)" }} />
                </div>
                <button type="button" className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: "#5865F2" }}>
                  <span>🎮</span> Войти через Discord
                </button>
              </>
            )}

            <p className="text-center text-sm" style={{ color: "var(--z-muted)" }}>
              {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
                className="font-medium" style={{ color: "var(--z-blue)" }}>
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </form>
        </div>
        <button onClick={onBack} className="md:hidden absolute top-6 left-6 flex items-center gap-2 text-sm" style={{ color: "var(--z-muted)" }}>
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>
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
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const goAuth = (mode: AuthMode = "login") => {
    setAuthMode(mode);
    setPage("auth");
  };

  const handleBuyClick = () => goAuth("register");

  if (page === "auth") {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onBack={() => setPage("home")}
      />
    );
  }

  return (
    <div style={{ background: "var(--z-bg)", minHeight: "100vh" }}>
      <Navbar onAuthClick={() => goAuth("login")} />
      <HeroSection onOrderClick={handleBuyClick} />
      <ServicesSection onBuy={handleBuyClick} />
      <Footer />
    </div>
  );
}