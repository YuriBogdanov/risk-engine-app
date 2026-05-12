import { useState, useEffect, useMemo } from 'react';
import { ConnectKitButton } from "connectkit";
import {
  ChevronDown, ChevronUp, ChevronRight, Search, X, ArrowDown, Settings, Wallet,
  AlertTriangle, ShieldCheck, ShieldAlert, Activity, Info,
  CheckCircle2, CheckCircle, XCircle, Loader2, ArrowRightLeft, Droplet, TrendingUp,
  UserMinus, PieChart, Check, Globe, Clock, ExternalLink, Sun, Moon,
  GraduationCap, BarChart3
} from 'lucide-react';
import { useAccount, useSendTransaction, useBalance, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';

const MOCK_NETWORKS = [
  { id: 'all', name: 'Все сети', icon: '🌐' },
  { id: '1', name: 'Ethereum', icon: '⟠' },
  { id: '56', name: 'BNB Chain', icon: '🟨' },
  { id: '8453', name: 'Base', icon: '🔵' },
];

const ANALYZER_NETWORKS = MOCK_NETWORKS.filter(n => n.id !== 'all');

const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null) return '—';
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
};

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--border); }

  .learn-prose h2 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-top: 2rem; margin-bottom: 0.75rem; }
  .learn-prose h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 1.25rem; margin-bottom: 0.5rem; }
  .learn-prose p  { color: var(--text-primary); line-height: 1.7; margin-bottom: 0.75rem; }
  .learn-prose strong { color: var(--text-primary); font-weight: 700; }
  .learn-prose em { color: var(--text-muted); font-style: italic; }
  .learn-prose code { background: var(--bg-input); padding: 0.1rem 0.4rem; border-radius: 0.4rem; font-size: 0.9em; color: #60a5fa; }
  .learn-prose ul, .learn-prose ol { margin: 0.5rem 0 1rem 1.25rem; color: var(--text-primary); }
  .learn-prose li { margin-bottom: 0.4rem; line-height: 1.6; }
  .learn-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
  .learn-prose th, .learn-prose td { border: 1px solid var(--border); padding: 0.6rem 0.8rem; text-align: left; }
  .learn-prose th { background: var(--bg-input); font-weight: 700; color: var(--text-primary); }
  .learn-prose td { color: var(--text-primary); }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

// ====================================================
// === КОНТЕНТ ОБУЧАЮЩИХ СТАТЕЙ (встроено в React) ===
// ====================================================

const LEARN_ARTICLES = {
  'what-is-scam': {
    title: 'Что такое скам токен?',
    content: (
      <div className="learn-prose">
        <p>
          <strong>Скам токен</strong> (от англ. <em>scam</em> — мошенничество) — это криптовалютный
          токен, созданный с целью обмана инвесторов. Такие токены используют доверие, жадность или
          незнание пользователей, чтобы забрать их деньги.
        </p>

        <h2>Основные разновидности</h2>

        <h3>1. Honeypot («Медовая ловушка»)</h3>
        <p>
          Токен, который можно купить, но <strong>нельзя продать</strong>. Смарт-контракт содержит
          скрытый код, блокирующий исходящие переводы для обычных пользователей.
        </p>

        <h3>2. Rug Pull («Вытащить ковёр»)</h3>
        <p>
          Разработчики создают токен, привлекают инвесторов, а затем{' '}
          <strong>выводят всю ликвидность</strong> и исчезают. Цена токена мгновенно падает до нуля.
        </p>

        <h3>3. Pump &amp; Dump («Накачка и сброс»)</h3>
        <p>
          Организованная группа людей <strong>искусственно разгоняет</strong> цену токена за счёт
          агрессивного маркетинга в Telegram/Twitter, а затем <strong>продаёт</strong> свои запасы,
          оставляя остальных с обесценившимся токеном.
        </p>

        <h3>4. Mint-скам</h3>
        <p>
          Смарт-контракт содержит функцию <strong>неограниченной эмиссии</strong> (<code>mintable</code>).
          После того как цена вырастет, разработчики печатают миллиарды новых токенов и продают их
          на рынок, разводняя стоимость.
        </p>

        <h3>5. Blacklist-ловушка</h3>
        <p>
          Контракт позволяет владельцу добавлять адреса в <strong>чёрный список</strong>, запрещая
          им продажу токена. После покупки кошелёк жертвы может быть заблокирован.
        </p>

        <h2>Как отличить скам от честного проекта?</h2>
        <table>
          <thead>
            <tr><th>Признак</th><th>Честный проект</th><th>Скам</th></tr>
          </thead>
          <tbody>
            <tr><td>Honeypot</td><td>Нет</td><td>Есть</td></tr>
            <tr><td>Налог на продажу</td><td>0–5%</td><td>&gt;10% или скрыт</td></tr>
            <tr><td>Ликвидность</td><td>Заблокирована</td><td>Разблокирована</td></tr>
            <tr><td>Доля создателя</td><td>&lt;5%</td><td>&gt;20%</td></tr>
            <tr><td>Код контракта</td><td>Верифицирован, читаем</td><td>Запутан или не открыт</td></tr>
            <tr><td>Команда</td><td>Публичная, с историей</td><td>Анонимная</td></tr>
          </tbody>
        </table>

        <h2>Что проверяет Risk Engine?</h2>
        <ul>
          <li><strong>Honeypot</strong> — через GoPlus Security API</li>
          <li><strong>Налоги</strong> на покупку и продажу</li>
          <li><strong>Mintable</strong> — возможность допечатки токенов</li>
          <li><strong>Концентрацию китов</strong> — топ-10 держателей</li>
          <li><strong>Поведение создателя</strong> — продавал ли он свои токены</li>
          <li><strong>Ликвидность</strong> — реальный объём DEX-пулов</li>
        </ul>
      </div>
    ),
  },

  'rugpull': {
    title: 'Rug Pull',
    content: (
      <div className="learn-prose">
        <p>
          <strong>Rug Pull</strong> (буквально «вытащить ковёр из-под ног») — мошенническая схема в
          DeFi, при которой разработчики проекта внезапно выводят все активы из пулов ликвидности
          и исчезают.
        </p>

        <h2>Как работает схема</h2>
        <ol>
          <li>Команда создаёт новый токен и пул ликвидности (например, SCAM/BNB на PancakeSwap)</li>
          <li>Агрессивный маркетинг в Telegram, Twitter, TikTok — обещания x100, x1000</li>
          <li>Инвесторы покупают токен, цена растёт</li>
          <li>В момент пика разработчики одной транзакцией изымают всю ликвидность</li>
          <li>Цена токена мгновенно падает до нуля</li>
        </ol>

        <h2>Виды Rug Pull</h2>
        <h3>Hard Rug (Жёсткий)</h3>
        <p>Мгновенное изъятие ликвидности. Самый распространённый вариант. Занимает одну транзакцию.</p>
        <h3>Slow Rug (Медленный)</h3>
        <p>Разработчики постепенно продают свои токены неделями/месяцами, пока сообщество не замечает схему.</p>
        <h3>Exit Scam</h3>
        <p>Команда собирает деньги на IDO/presale, а затем просто исчезает, не запустив продукт.</p>

        <h2>Признаки потенциального Rug Pull</h2>
        <ul>
          <li>Ликвидность не заблокирована (нет LP lock на 6+ месяцев)</li>
          <li>Разработчик владеет большой долей токенов (&gt;10%)</li>
          <li>Анонимная команда без верифицированной истории</li>
          <li>Нет аудита смарт-контракта</li>
          <li>Обещания нереальной доходности</li>
          <li>Давление «покупай сейчас или опоздаешь»</li>
        </ul>

        <h2>Как защититься</h2>
        <ul>
          <li>Проверяйте <strong>Lock ликвидности</strong> через Team.Finance или Unicrypt</li>
          <li>Смотрите на <strong>топ-холдеров</strong> — кому принадлежит &gt;5% токенов</li>
          <li>Изучайте <strong>историю транзакций</strong> создателя на BscScan</li>
          <li>Используйте <strong>Risk Engine</strong> для автоматической проверки</li>
        </ul>
      </div>
    ),
  },

  'honeypot': {
    title: 'Honeypot',
    content: (
      <div className="learn-prose">
        <p>
          <strong>Honeypot</strong> («медовая ловушка») — токен, смарт-контракт которого позволяет
          покупать токены, но <strong>блокирует их продажу</strong> для обычных пользователей.
        </p>

        <h2>Как работает ловушка</h2>
        <p>
          В коде контракта содержится специальная проверка. При попытке продажи токена транзакция
          «ревертится» (откатывается) с ошибкой типа <code>Transfer failed</code> или{' '}
          <code>Insufficient allowance</code>. При этом разработчик (owner) может продавать
          свободно — для него условие проверки другое.
        </p>

        <h2>Технические реализации</h2>
        <h3>1. Blacklist (чёрный список)</h3>
        <p>
          Контракт содержит функцию <code>addToBlacklist(address)</code>. Все новые покупатели
          автоматически добавляются в чёрный список — и не могут продать.
        </p>
        <h3>2. Высокий налог на продажу</h3>
        <p>
          Функция <code>_transfer</code> берёт 99% налог при продаже. Формально продать можно, но
          вы получите ничтожную сумму.
        </p>
        <h3>3. Ограничение на DEX</h3>
        <p>
          Контракт проверяет, что <code>msg.sender != router</code> при продаже — и откатывает
          транзакцию через DEX-роутер.
        </p>

        <h2>Как обнаружить honeypot</h2>
        <ul>
          <li>Использовать сервис <strong>honeypot.is</strong> — симулирует покупку и продажу</li>
          <li>Проверить <strong>налог на продажу</strong> (sell tax) — если &gt;10%, подозрительно</li>
          <li>Изучить код контракта на BscScan — ищите слова <code>blacklist</code>, <code>whitelist</code></li>
          <li>Использовать <strong>Risk Engine</strong> — он автоматически проверяет через GoPlus API</li>
        </ul>

        <h2>Что показывает Risk Engine</h2>
        <p>Risk Engine использует GoPlus Security API, который:</p>
        <ul>
          <li>Симулирует покупку и продажу токена</li>
          <li>Определяет реальный налог (buy tax / sell tax)</li>
          <li>Проверяет наличие функций <code>blacklist</code>, <code>whitelist</code>, <code>pause</code></li>
          <li>Показывает, может ли владелец изменить налоги</li>
        </ul>
      </div>
    ),
  },

  'how-to-check': {
    title: 'Как проверить токен',
    content: (
      <div className="learn-prose">
        <p>
          Перед покупкой любого незнакомого токена стоит провести базовую проверку. Вот пошаговый
          алгоритм.
        </p>

        <h2>Шаг 1: Найдите адрес контракта</h2>
        <p>
          Никогда не используйте токены, найденные только в Telegram/Twitter. Найдите официальный
          адрес контракта на сайте проекта или в CoinMarketCap/CoinGecko.
        </p>

        <h2>Шаг 2: Проверьте базовые параметры</h2>
        <ul>
          <li><strong>GoPlus Security</strong> (gopluslabs.io) — honeypot, налоги, mintable</li>
          <li><strong>BscScan / Etherscan</strong> — верифицированный ли код контракта</li>
          <li><strong>DEXScreener</strong> — ликвидность, объём торгов, возраст пула</li>
        </ul>

        <h2>Шаг 3: Изучите холдеров</h2>
        <ul>
          <li>Откройте токен на BscScan → вкладка «Holders»</li>
          <li>Смотрите топ-10 кошельков — нет ли концентрации &gt;50%</li>
          <li>Проверьте кошелёк создателя — не продавал ли он токены</li>
        </ul>

        <h2>Шаг 4: Проверьте ликвидность</h2>
        <ul>
          <li>LP-токены должны быть заблокированы (locked)</li>
          <li>Реальная ликвидность DEX-пула должна быть &gt; $50,000</li>
          <li>Проверьте дату создания пула — старый пул надёжнее</li>
        </ul>

        <h2>Шаг 5: Используйте Risk Engine</h2>
        <p>
          Risk Engine автоматизирует шаги 2–4. Вставьте адрес токена в поле поиска вкладки «Анализ»
          — получите готовый отчёт за 10–15 секунд с оценкой риска от 0 до 100.
        </p>

        <table>
          <thead><tr><th>Оценка</th><th>Уровень</th><th>Рекомендация</th></tr></thead>
          <tbody>
            <tr><td>0–29</td><td>LOW</td><td>Безопасно покупать</td></tr>
            <tr><td>30–69</td><td>MEDIUM</td><td>Умеренный риск, изучите детали</td></tr>
            <tr><td>70–89</td><td>HIGH</td><td>Высокий риск, будьте осторожны</td></tr>
            <tr><td>90–100</td><td>CRITICAL</td><td>Вероятный скам, не покупайте</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },

  'on-chain': {
    title: 'On-chain анализ',
    content: (
      <div className="learn-prose">
        <p>
          <strong>On-chain анализ</strong> — изучение данных, записанных прямо в блокчейне:
          транзакции, балансы кошельков, события смарт-контрактов. В отличие от биржевых данных,
          эти данные невозможно подделать.
        </p>

        <h2>Что можно узнать из блокчейна</h2>
        <h3>История транзакций кошелька</h3>
        <p>
          Каждая транзакция навсегда записана в блокчейне. Зная адрес разработчика, можно увидеть:
          когда он продавал токены, на какую сумму, куда переводил деньги.
        </p>
        <h3>Список холдеров</h3>
        <p>
          BscScan/Etherscan показывает топ-1000 держателей токена с их долями. Это позволяет выявить
          концентрацию в руках нескольких кошельков.
        </p>
        <h3>Данные о ликвидности</h3>
        <p>
          DEXScreener и DexTools показывают реальный объём ликвидности в пулах, историю
          добавления/изъятия LP-токенов.
        </p>

        <h2>Инструменты для on-chain анализа</h2>
        <ul>
          <li><strong>BscScan</strong> (bscscan.com) — BSC блокчейн</li>
          <li><strong>Etherscan</strong> (etherscan.io) — Ethereum</li>
          <li><strong>DEXScreener</strong> (dexscreener.com) — данные DEX-пулов</li>
          <li><strong>Moralis API</strong> — программный доступ к данным блокчейна</li>
          <li><strong>GoPlus Security</strong> — аудит безопасности токенов</li>
        </ul>

        <h2>Что анализирует Risk Engine</h2>
        <p>Risk Engine использует несколько API для сбора on-chain данных:</p>
        <ul>
          <li><strong>GoPlus</strong> — проверка смарт-контракта (honeypot, налоги, функции)</li>
          <li><strong>Moralis</strong> — топ-10 держателей + история транзакций создателя</li>
          <li><strong>DexScreener</strong> — ликвидность, объём, изменение цены</li>
          <li><strong>CoinMarketCap</strong> — уточнённые данные по объёму торгов</li>
        </ul>
        <p>
          Все данные обрабатываются алгоритмом, который выдаёт итоговый Risk Score от 0 до 100.
        </p>
      </div>
    ),
  },

  'whale-tracking': {
    title: 'Отслеживание китов',
    content: (
      <div className="learn-prose">
        <p>
          <strong>Киты</strong> (whales) в криптовалюте — кошельки, владеющие большой долей
          определённого токена. Их действия могут значительно влиять на цену.
        </p>

        <h2>Почему концентрация опасна</h2>
        <p>
          Если 5–10 кошельков владеют 80% токенов, то один крупный продавец обрушит цену на 50–80%.
          Это типичная ситуация для скам-токенов: инсайдеры держат большинство токенов и продают
          после разгона цены.
        </p>

        <h2>Как работает анализ китов в Risk Engine</h2>
        <p>Risk Engine получает топ-10 держателей через Moralis API и анализирует:</p>
        <ul>
          <li><strong>Суммарную долю</strong> топ-10 приватных кошельков</li>
          <li>Исключает <strong>известные адреса</strong>: биржи, контракты, burn-адреса</li>
          <li>Если доля &gt;50% — риск манипуляции считается <strong>высоким</strong></li>
        </ul>

        <h2>Пороговые значения</h2>
        <table>
          <thead><tr><th>Доля топ-10 кошельков</th><th>Оценка</th></tr></thead>
          <tbody>
            <tr><td>&lt; 30%</td><td>Хорошее распределение</td></tr>
            <tr><td>30–50%</td><td>Умеренная концентрация</td></tr>
            <tr><td>&gt; 50%</td><td>Высокий риск манипуляции</td></tr>
          </tbody>
        </table>

        <h2>Дополнительные признаки</h2>
        <ul>
          <li>Кошельки топ-холдеров созданы одновременно (ботовые фермы)</li>
          <li>Крупные кошельки активны только в момент pump'а</li>
          <li>Создатель токена — один из топ-держателей и активно продаёт</li>
        </ul>

        <h2>Как самостоятельно проверить</h2>
        <p>
          Зайдите на BscScan, найдите токен, откройте вкладку «Holders». Посмотрите адреса топ-10
          кошельков — не пересекаются ли они с адресом создателя или между собой (перекрёстные
          переводы = инсайдеры).
        </p>
      </div>
    ),
  },
};

const LEARN_SECTIONS = [
  { label: 'Основы',                ids: ['what-is-scam', 'rugpull', 'honeypot', 'how-to-check'] },
  { label: 'Продвинутый уровень',   ids: ['on-chain', 'whale-tracking'] },
];

// ====================================================
// === ОСНОВНОЙ КОМПОНЕНТ ===
// ====================================================

function App() {
  // === ТЕМА ===
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // === ВКЛАДКИ ===
  const [activeTab, setActiveTab] = useState('analyze');

  // === МОДАЛКИ И ПОИСК (общее для свопа) ===
  const [modalMode, setModalMode] = useState(null);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(MOCK_NETWORKS[0]);

  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchAssets, setGlobalSearchAssets] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // === ТОКЕНЫ СВОПА ===
  const [payToken, setPayToken] = useState(null);
  const [receiveToken, setReceiveToken] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();

  // === Live-баланс с RPC (без кэша/индексации Moralis) ===
  const { data: payLiveBalance, status: payLiveStatus, refetch: refetchPayLive } = useBalance({
    address: address,
    token: (payToken && !payToken.isNative) ? payToken.address : undefined,
    chainId: payToken ? Number(payToken.chain_id) : undefined,
    query: {
      enabled: !!payToken && !!address && isConnected,
      refetchInterval: 10000,
    },
  });

  const { data: receiveLiveBalance, status: receiveLiveStatus, refetch: refetchReceiveLive } = useBalance({
    address: address,
    token: (receiveToken && !receiveToken.isNative) ? receiveToken.address : undefined,
    chainId: receiveToken ? Number(receiveToken.chain_id) : undefined,
    query: {
      enabled: !!receiveToken && !!address && isConnected,
      refetchInterval: 10000,
    },
  });

  const payBackendNum = Number(payToken?.balance || 0);
  const receiveBackendNum = Number(receiveToken?.balance || 0);

  // Предпочитаем backend (Moralis) — он надёжен на любых сетях, включая локальные форки.
  // Live-баланс с RPC используется только как дополнение, когда backend не знает токен
  // (например, пользователь выбрал кастомный токен через поиск DexScreener).
  // После свопа payToken.balance выставляется в '0' явно — баланс обнуляется сразу.
  const payLiveNum = payLiveBalance ? Number(payLiveBalance.formatted) : 0;
  const receiveLiveNum = receiveLiveBalance ? Number(receiveLiveBalance.formatted) : 0;

  const payBalanceNum = payBackendNum > 0 ? payBackendNum : payLiveNum;
  const receiveBalanceNum = receiveBackendNum > 0 ? receiveBackendNum : receiveLiveNum;

  const formatBalanceDisplay = (n) => {
    if (!n || n === 0) return '0.00';
    if (n < 0.0001) return n.toExponential(2);
    if (n < 1) return n.toFixed(6);
    if (n < 100) return n.toFixed(4);
    return n.toFixed(2);
  };

  const [backendData, setBackendData] = useState(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  const [riskData, setRiskData] = useState(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);

  const [debouncedPayAmount, setDebouncedPayAmount] = useState(payAmount);
  const [quoteData, setQuoteData] = useState(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState('');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRiskExpanded, setIsRiskExpanded] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryTx, setSelectedHistoryTx] = useState(null);

  const [swapHistory, setSwapHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('swapHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Локальные оверрайды для балансов токенов после свопа.
  // { "0xaddr_56": { balance: "0", usd_value: 0, until: timestamp } }
  // Используется чтобы перебить stale данные Moralis (индексация 30-60 сек после свопа).
  const [balanceOverrides, setBalanceOverrides] = useState({});

  const overrideKey = (address, chainId) => `${String(address || '').toLowerCase()}_${chainId}`;

  // === ВКЛАДКА АНАЛИЗАТОРА ===
  const [analyzerQuery, setAnalyzerQuery] = useState('');
  const [analyzerNetwork, setAnalyzerNetwork] = useState(ANALYZER_NETWORKS[1]);
  const [isAnalyzerNetworkOpen, setIsAnalyzerNetworkOpen] = useState(false);
  const [analyzerSearchResults, setAnalyzerSearchResults] = useState([]);
  const [isAnalyzerSearching, setIsAnalyzerSearching] = useState(false);
  const [analyzerDropdownOpen, setAnalyzerDropdownOpen] = useState(false);
  const [analyzerToken, setAnalyzerToken] = useState(null);
  const [analyzerRiskData, setAnalyzerRiskData] = useState(null);
  const [isAnalyzerRiskLoading, setIsAnalyzerRiskLoading] = useState(false);

  // === ВКЛАДКА ОБУЧЕНИЕ ===
  const [activeLearnArticle, setActiveLearnArticle] = useState('what-is-scam');

  const addNotification = (message, type = 'success', hash = null) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, hash }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const groupedHistory = useMemo(() => {
    if (!address) return {};
    const userTxs = swapHistory.filter(tx => tx.userWallet && tx.userWallet.toLowerCase() === address.toLowerCase());
    return userTxs.reduce((acc, tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(tx);
      return acc;
    }, {});
  }, [swapHistory, address]);

  const hasHistory = Object.keys(groupedHistory).length > 0;

  const bnbToken = useMemo(() => {
    return backendData?.assets?.find(t => (t.symbol === 'BNB' || t.symbol === 'WBNB') && Number(t.usd_value) > 0) || null;
  }, [backendData]);

  const bnbPrice = bnbToken ? (Number(bnbToken.usd_value) / Number(bnbToken.balance)) : 600;

  const getTokenPrice = (token) => {
    if (!token) return 0;
    if (token.isNative || token.symbol === 'BNB' || token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return bnbPrice;
    }
    let price = 0;
    if (token.isCustom) {
      price = Number(token.usd_value || 0);
    } else {
      const bal = Number(token.balance);
      if (bal > 0) price = Number(token.usd_value) / bal;
    }
    return (isFinite(price) && !isNaN(price)) ? price : 0;
  };

  const isSyncing = payAmount !== debouncedPayAmount;

  const receiveAmount = (quoteData && !quoteData.error && !isQuoteLoading) ? Number(quoteData.expected_output_human) : 0;
  const receiveUsd = receiveAmount ? (receiveAmount * getTokenPrice(receiveToken)) : 0;
  const receiveUsdDisplay = receiveUsd > 0 ? `$${receiveUsd.toFixed(2)}` : '$-';

  // Если цена токена неизвестна (DexScreener не вернул priceUsd), берём из котировки:
  // payUsd ≈ receiveUsd (обе стороны одной сделки в USD почти равны).
  const payTokenPrice = getTokenPrice(payToken);
  const payUsdRaw = payAmount ? Number(payAmount) * payTokenPrice : 0;
  const payUsd = payUsdRaw > 0 ? payUsdRaw : (receiveUsd > 0 ? receiveUsd : 0);
  const payUsdDisplay = payUsd > 0 ? `$${payUsd.toFixed(2)}` : (payAmount ? '$-' : '$-');

  const poolLiquidity = riskData?.security_analysis?.verdict?.total_liquidity_usd || 0;
  const isLiquidityError = poolLiquidity > 0 && payUsd > poolLiquidity;

  const priceImpact = (!isQuoteLoading && !isSyncing && payUsdRaw > 0 && receiveUsd > 0)
    ? ((payUsdRaw - receiveUsd) / payUsdRaw * 100)
    : 0;

  const isWarningPriceImpact = !isQuoteLoading && !isSyncing && priceImpact > 10;

  const getButtonText = () => {
    if (!payAmount || Number(payAmount) <= 0) return "Введите сумму";
    if (!receiveToken) return "Выберите токен";
    if (isInsufficientBalance) return `Недостаточно ${payToken?.symbol}`;
    if (isQuoteLoading) return "Поиск лучшей цены...";
    if (isLiquidityError) return "Превышена ликвидность пула";
    if (!quoteData || quoteData.error) return "Маршрут не найден";
    if (isWarningPriceImpact) return `Опасный обмен (${priceImpact.toFixed(1)}%)`;
    return "Обмен";
  };

  const isInsufficientBalance = !!(isConnected && payToken && payBalanceNum > 0 && Number(payAmount) > payBalanceNum);

  const isSwapDisabled = !payToken || !receiveToken || !payAmount || Number(payAmount) <= 0 || isSwapping || isQuoteLoading || !quoteData || !!quoteData.error || isLiquidityError || isInsufficientBalance;

  useEffect(() => {
    if (backendData && backendData.assets && backendData.assets.length > 0 && !payToken && !receiveToken) {
      const nativeAsset = backendData.assets.find(t => t.isNative);
      if (nativeAsset) setPayToken(nativeAsset);
    }
  }, [backendData, payToken, receiveToken]);

  const applyOverrides = (data) => {
    if (!data?.assets) return data;
    const now = Date.now();
    const activeOverrides = Object.entries(balanceOverrides).filter(([_, v]) => v.until > now);
    if (activeOverrides.length === 0) return data;
    const map = Object.fromEntries(activeOverrides);
    const assets = data.assets.map(t => {
      const key = overrideKey(t.address, t.chain_id);
      if (map[key]) return { ...t, balance: map[key].balance, usd_value: map[key].usd_value };
      return t;
    });
    // Добавим injection-токены, которых нет в ответе Moralis
    for (const [key, ov] of activeOverrides) {
      if (!assets.find(t => overrideKey(t.address, t.chain_id) === key) && ov.token) {
        assets.push({ ...ov.token, balance: ov.balance, usd_value: ov.usd_value });
      }
    }
    return { ...data, assets };
  };

  const fetchAssets = async (networkId = selectedNetwork.id, force = false) => {
    if (!address) return;
    setIsLoadingAssets(true);
    try {
      const url = `http://127.0.0.1:8000/api/assets/${networkId}/${address}${force ? '?force=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setBackendData(applyOverrides(data));
    } catch (error) {
      console.error("Ошибка API активов:", error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchAssets(selectedNetwork.id);
    }
  }, [isConnected, address, selectedNetwork.id]);

  // === Глобальный поиск (для модалки свопа) ===
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setGlobalSearchAssets([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
        const data = await res.json();
        if (isMounted && data.pairs) {
          const chainMap = { 'ethereum': '1', 'bsc': '56', 'base': '8453' };
          const unique = [];
          const seen = new Set();
          data.pairs.forEach(pair => {
            const chainId = chainMap[pair.chainId];
            if (chainId && (selectedNetwork.id === 'all' || selectedNetwork.id === chainId)) {
              const addr = pair.baseToken.address.toLowerCase();
              if (!seen.has(addr)) {
                seen.add(addr);
                unique.push({
                  symbol: pair.baseToken.symbol,
                  name: pair.baseToken.name,
                  address: addr,
                  balance: "0.00",
                  usd_value: parseFloat(pair.priceUsd || 0),
                  isNative: false,
                  isSpam: false,
                  chain_id: chainId,
                  isCustom: true
                });
              }
            }
          });
          setGlobalSearchAssets(unique.slice(0, 15));
        }
      } catch (e) {
        console.error("Ошибка глобального поиска:", e);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedNetwork]);

  // === Поиск токена в АНАЛИЗАТОРЕ ===
  useEffect(() => {
    const query = analyzerQuery.trim();
    if (query.length < 2) {
      setAnalyzerSearchResults([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsAnalyzerSearching(true);
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
        const data = await res.json();
        if (isMounted && data.pairs) {
          const chainMap = { 'ethereum': '1', 'bsc': '56', 'base': '8453' };
          const unique = [];
          const seen = new Set();
          data.pairs.forEach(pair => {
            const chainId = chainMap[pair.chainId];
            if (chainId === analyzerNetwork.id) {
              const addr = pair.baseToken.address.toLowerCase();
              if (!seen.has(addr)) {
                seen.add(addr);
                unique.push({
                  symbol: pair.baseToken.symbol,
                  name: pair.baseToken.name,
                  address: addr,
                  chain_id: chainId,
                  liquidity_usd: pair.liquidity?.usd || 0,
                  price_usd: parseFloat(pair.priceUsd || 0),
                });
              }
            }
          });

          const isEVMAddress = /^0x[a-fA-F0-9]{40}$/i.test(query);
          if (isEVMAddress && !unique.find(t => t.address.toLowerCase() === query.toLowerCase())) {
            unique.unshift({
              symbol: 'New Token',
              name: 'Неизвестный контракт',
              address: query.toLowerCase(),
              chain_id: analyzerNetwork.id,
              liquidity_usd: 0,
              price_usd: 0,
            });
          }

          setAnalyzerSearchResults(unique.slice(0, 12));
        }
      } catch (e) {
        console.error("Ошибка поиска анализатора:", e);
      } finally {
        if (isMounted) setIsAnalyzerSearching(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [analyzerQuery, analyzerNetwork]);

  // === Загрузка риск-данных в АНАЛИЗАТОРЕ ===
  useEffect(() => {
    if (!analyzerToken) {
      setAnalyzerRiskData(null);
      return;
    }
    let isMounted = true;
    const controller = new AbortController();

    const fetchRisk = async () => {
      setIsAnalyzerRiskLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/analyze/${analyzerToken.chain_id}/${analyzerToken.address}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        const data = await response.json();
        if (isMounted) setAnalyzerRiskData(data);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error("Ошибка анализатора:", error);
        if (isMounted) setAnalyzerRiskData({ error: true, message: "Не удалось получить данные. Возможно токен слишком новый." });
      } finally {
        if (isMounted) setIsAnalyzerRiskLoading(false);
      }
    };

    fetchRisk();
    return () => { isMounted = false; controller.abort(); };
  }, [analyzerToken]);

  // === Риск-фетч для свопа ===
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchRisk = async () => {
      if (!receiveToken) {
        setRiskData(null);
        return;
      }

      if (receiveToken.isNative) {
        setRiskData({
          isSafeDefault: true,
          message: "Нативная монета сети. Максимальный уровень доверия.",
          score: 0,
          security_analysis: { verdict: { total_liquidity_usd: 1000000000 } }
        });
        return;
      }

      const STABLECOINS = ['USDT', 'USDC', 'DAI', 'FDUSD', 'BUSD', 'TUSD', 'USDD'];
      if (STABLECOINS.includes(receiveToken.symbol.toUpperCase())) {
        setRiskData({
          isSafeDefault: true,
          message: "Авторизованный стейблкоин. Актив обеспечен фиатными резервами.",
          score: 1,
          security_analysis: { verdict: { total_liquidity_usd: 1000000000 } }
        });
        return;
      }

      setIsRiskLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/analyze/${receiveToken.chain_id}/${receiveToken.address}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        const data = await response.json();
        if (isMounted) setRiskData(data);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error("Ошибка API анализатора:", error);
        if (isMounted) setRiskData({ error: true, message: "Не удалось получить данные. Возможно токен слишком новый." });
      } finally {
        if (isMounted) setIsRiskLoading(false);
      }
    };

    const riskTimer = setTimeout(() => { fetchRisk(); }, 600);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(riskTimer);
    };
  }, [receiveToken]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPayAmount(payAmount), 500);
    return () => clearTimeout(timer);
  }, [payAmount]);

  useEffect(() => {
    if (!backendData?.assets) return;
    const syncToken = (token, isPaySide) => {
      if (!token) return token;
      const match = backendData.assets.find(t =>
        t.address?.toLowerCase() === token.address?.toLowerCase() &&
        String(t.chain_id) === String(token.chain_id)
      );
      if (!match) return token;
      // Защита только для pay-токена: если мы продали все (локально 0),
      // не даём устаревшим данным Moralis восстановить фантомный баланс.
      // Для receive-токена защита не нужна — нам наоборот нужно обновить баланс.
      const currentBal = Number(token.balance || 0);
      if (isPaySide && currentBal === 0 && Number(match.balance || 0) > 0) {
        return { ...token, usd_value: match.usd_value, isCustom: false };
      }
      return { ...token, balance: match.balance, usd_value: match.usd_value, isCustom: false };
    };
    setPayToken(prev => syncToken(prev, true));
    setReceiveToken(prev => syncToken(prev, false));
  }, [backendData]);

  useEffect(() => {
    let intervalId;

    const fetchQuote = async (isBackgroundRefresh = false) => {
      if (!payToken || !receiveToken || !debouncedPayAmount || Number(debouncedPayAmount) <= 0) {
        setQuoteData(null);
        return;
      }

      if (!isBackgroundRefresh) {
        setQuoteData(null);
        setIsQuoteLoading(true);
      }

      try {
        const decimals = payToken.decimals || 18;
        const amountWei = parseUnits(debouncedPayAmount.toString(), decimals).toString();

        const fromAddress = payToken.isNative ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : payToken.address;
        const toAddress = receiveToken.isNative ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : receiveToken.address;

        const response = await fetch(`http://127.0.0.1:8000/api/quote?chain_id=${receiveToken.chain_id}&from_token=${fromAddress}&to_token=${toAddress}&amount_wei=${amountWei}`);
        if (!response.ok) throw new Error("Quote API Error");

        const data = await response.json();
        setQuoteData(data);
      } catch (error) {
        console.error("Ошибка API котировки:", error);
        if (!isBackgroundRefresh) setQuoteData({ error: "Ошибка соединения с сервером" });
      } finally {
        if (!isBackgroundRefresh) setIsQuoteLoading(false);
      }
    };

    fetchQuote();

    if (payToken && receiveToken && debouncedPayAmount && Number(debouncedPayAmount) > 0) {
      intervalId = setInterval(() => { fetchQuote(true); }, 5000);
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [payToken, receiveToken, debouncedPayAmount]);

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
    setIsNetworkDropdownOpen(false);
    fetchAssets(network.id);
  };

  const openModal = (mode) => {
    setModalMode(mode);
    setSearchQuery('');

    let targetChainId = null;
    if (mode === 'receive' && payToken) targetChainId = String(payToken.chain_id);
    if (mode === 'pay' && receiveToken) targetChainId = String(receiveToken.chain_id);

    if (targetChainId) {
      const net = MOCK_NETWORKS.find(n => n.id === targetChainId);
      if (net && selectedNetwork.id !== net.id) {
        setSelectedNetwork(net);
        fetchAssets(net.id);
      } else if (!backendData) {
        fetchAssets(selectedNetwork.id);
      }
    } else if (!backendData) {
      fetchAssets(selectedNetwork.id);
    }
  };

  const handleSelectToken = (token) => {
    const tokenChain = String(token.chain_id);

    if (modalMode === 'pay') {
      if (receiveToken) {
        if (String(receiveToken.chain_id) !== tokenChain || receiveToken.address.toLowerCase() === token.address.toLowerCase()) {
          setReceiveToken(null);
          setRiskData(null);
        }
      }
      setPayToken(token);
    } else if (modalMode === 'receive') {
      if (payToken) {
        if (String(payToken.chain_id) !== tokenChain || payToken.address.toLowerCase() === token.address.toLowerCase()) {
          setPayToken(null);
        }
      }
      setReceiveToken(token);
      setRiskData(null);
      setIsRiskExpanded(false);
    }
    setModalMode(null);
  };

  const handleSwapSides = () => {
    const tempToken = payToken;
    setPayToken(receiveToken);
    setReceiveToken(tempToken);
    setRiskData(null);

    if (quoteData && !quoteData.error && quoteData.expected_output_human) {
      const newAmount = Number(quoteData.expected_output_human).toFixed(6).replace(/\.?0+$/, '');
      setPayAmount(newAmount);
    } else {
      setPayAmount('');
    }
  };

  const handleSwap = async () => {
    if (!payToken || !receiveToken || !payAmount || !address) return;

    setIsSwapping(true);
    setSwapStatus('Проверка разрешения...');

    try {
      // Декималы: приоритет live-данные RPC, потом payToken, иначе 18
      const decimals = payLiveBalance?.decimals ?? payToken.decimals ?? 18;
      const amountWei = parseUnits(payAmount, decimals).toString();

      const reqBody = {
        chainId: String(payToken.chain_id || "56"),
        fromToken: payToken.isNative ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : payToken.address,
        toToken: receiveToken.isNative ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : receiveToken.address,
        amountWei: amountWei,
        userWallet: address
      };

      const approveRes = await fetch("http://127.0.0.1:8000/api/build-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });
      const approveData = await approveRes.json();

      if (approveData.needsApprove && approveData.tx) {
        setSwapStatus('Подтвердите Approve в MetaMask...');
        const approveHash = await sendTransactionAsync({
          to: approveData.tx.to,
          data: approveData.tx.data,
          value: approveData.tx.value ? BigInt(approveData.tx.value) : 0n
        });
        setSwapStatus('Ожидание подтверждения approve в блокчейне...');
        // Критично: ждём попадания approve в блок, иначе следующий swap
        // упадёт на eth_estimateGas (allowance ещё 0)
        if (publicClient && approveHash) {
          try {
            await publicClient.waitForTransactionReceipt({
              hash: approveHash,
              timeout: 60_000,
              confirmations: 1,
            });
          } catch (e) {
            console.warn("Approve receipt timeout, fallback sleep", e);
            await new Promise(r => setTimeout(r, 5000));
          }
        } else {
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      setSwapStatus('Формирование маршрута...');
      const swapRes = await fetch("http://127.0.0.1:8000/api/build-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });
      const swapData = await swapRes.json();

      if (swapData.error) throw new Error(swapData.error);

      setSwapStatus('Подтвердите Swap в MetaMask...');
      const swapHash = await sendTransactionAsync({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value ? BigInt(swapData.tx.value) : 0n,
        // Передаём gas от 1inch с буфером 1.3× чтобы MetaMask
        // не блокировал транзакцию из-за своей неверной оценки газа
        gas: swapData.tx.gas ? BigInt(Math.ceil(Number(swapData.tx.gas) * 1.3)) : undefined,
      });

      const newHistoryTx = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userWallet: address,
        payAmount: debouncedPayAmount,
        paySymbol: payToken.symbol,
        receiveAmount: receiveAmount,
        receiveSymbol: receiveToken.symbol,
        priceImpact: priceImpact,
        route: quoteData?.route_used || ['1inch API'],
        hash: swapHash
      };

      setSwapHistory(prev => {
        const updated = [newHistoryTx, ...prev];
        localStorage.setItem('swapHistory', JSON.stringify(updated));
        return updated;
      });

      addNotification('Обмен успешно выполнен!', 'success', swapHash);
      setPayAmount('');
      setIsConfirmModalOpen(false);

      // Вычисляем реальный остаток: текущий баланс минус потраченная сумма.
      // НЕ обнуляем до 0 — пользователь мог продать лишь часть (1 USDT из 400).
      const spentAmount = Number(payAmount);
      const newPayBalance = Math.max(0, payBalanceNum - spentAmount);
      const newPayUsd = newPayBalance * payTokenPrice;

      setPayToken(prev => prev ? {
        ...prev,
        balance: String(newPayBalance.toFixed(6)),
        usd_value: newPayUsd,
      } : prev);

      // Ждём попадания swap-tx в блок, потом обновляем балансы
      if (publicClient && swapHash) {
        try {
          await publicClient.waitForTransactionReceipt({
            hash: swapHash,
            timeout: 90_000,
            confirmations: 1,
          });
        } catch (e) {
          console.warn("Swap receipt wait timeout", e);
        }
      }
      // Live-балансы читаются с RPC — обновляем сразу
      refetchPayLive?.();
      refetchReceiveLive?.();

      // Регистрируем оверрайды балансов на 120 секунд — переживут force-refetch backend.
      if (receiveToken && quoteData?.expected_output_human) {
        const expireAt = Date.now() + 120_000;
        // Receive: прибавляем полученное к текущему балансу (пользователь мог уже иметь этот токен)
        const receivedAmount = Number(quoteData.expected_output_human);
        const newReceiveBalance = receiveBalanceNum + receivedAmount;
        const newReceiveUsd = newReceiveBalance * getTokenPrice(receiveToken);
        const recvBalance = String(newReceiveBalance.toFixed(6));
        const recvUsd = newReceiveUsd > 0 ? newReceiveUsd : (receiveToken.usd_value || 0);

        const newOverrides = {
          [overrideKey(payToken.address, payToken.chain_id)]: {
            balance: String(newPayBalance.toFixed(6)),
            usd_value: newPayUsd,
            until: expireAt,
            token: null,
          },
          [overrideKey(receiveToken.address, receiveToken.chain_id)]: {
            balance: recvBalance, usd_value: recvUsd, until: expireAt,
            token: { ...receiveToken, isCustom: false },
          },
        };
        setBalanceOverrides(prev => ({ ...prev, ...newOverrides }));

        // Применяем оверрайды к текущему backendData немедленно — для синхронности UI
        setBackendData(prev => {
          if (!prev?.assets) return prev;
          const recvAddr = receiveToken.address?.toLowerCase();
          const soldAddr = payToken.address?.toLowerCase();
          const filtered = prev.assets
            .filter(t => t.address?.toLowerCase() !== recvAddr)
            .map(t => t.address?.toLowerCase() === soldAddr
              ? { ...t, balance: String(newPayBalance.toFixed(6)), usd_value: newPayUsd }
              : t
            );
          const injectedReceive = {
            ...receiveToken,
            balance: recvBalance,
            usd_value: recvUsd,
            isCustom: false,
          };
          return { ...prev, assets: [...filtered, injectedReceive] };
        });
      }

      // Полный рефреш бэкенда с несколькими попытками (Moralis медленный)
      setTimeout(() => fetchAssets(selectedNetwork.id, true), 5000);
      setTimeout(() => fetchAssets(selectedNetwork.id, true), 15000);
      // После истечения оверрайдов (120с) — финальный рефреш с актуальными данными Moralis
      setTimeout(() => fetchAssets(selectedNetwork.id, true), 125_000);

    } catch (error) {
      console.error("Swap Error:", error);
      addNotification(`Ошибка обмена: ${error.message || 'Транзакция отклонена.'}`, 'error');
    } finally {
      setIsSwapping(false);
      setSwapStatus('');
    }
  };

  const displayAssets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let assets = (backendData && backendData.assets) ? backendData.assets : [];

    if (selectedNetwork.id !== 'all') {
      assets = assets.filter(token => String(token.chain_id) === String(selectedNetwork.id));
    }

    const localFiltered = assets.filter(token =>
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query) ||
      (token.address && token.address.toLowerCase().includes(query))
    );

    const localAddresses = new Set(localFiltered.map(t => t.address?.toLowerCase()));
    const globalFiltered = globalSearchAssets.filter(t => !localAddresses.has(t.address.toLowerCase()));

    let combined = [...localFiltered, ...globalFiltered];

    if (isConnected && (selectedNetwork.id === 'all' || selectedNetwork.id === '56')) {
      const hasBnb = combined.find(t => t.symbol === 'BNB' && t.isNative);
      if (!hasBnb && (!query || 'bnb'.includes(query))) {
        combined.unshift({
          symbol: "BNB",
          name: "BNB (Local Sandbox)",
          address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          balance: "10000.00",
          usd_value: 0,
          isNative: true,
          isSpam: false,
          chain_id: '56',
          decimals: 18
        });
      }
    }

    const isEVMAddress = /^0x[a-fA-F0-9]{40}$/i.test(query);
    if (isEVMAddress && combined.length === 0 && !isSearching) {
      combined.push({
        symbol: "New Token",
        name: "Неизвестный контракт",
        address: query,
        balance: "0.00",
        usd_value: 0,
        isNative: false,
        isSpam: false,
        chain_id: selectedNetwork.id === 'all' ? '56' : selectedNetwork.id,
        isCustom: true
      });
    }

    return combined;
  }, [backendData, searchQuery, globalSearchAssets, selectedNetwork, isSearching, isConnected]);

  const displayReceiveSymbol = (riskData && !isRiskLoading && riskData.token_info?.symbol && riskData.token_info.symbol !== 'Unknown')
    ? riskData.token_info.symbol
    : receiveToken?.symbol;

  // ==========================================================
  // === HELPER: РЕНДЕР РИСК-ПАНЕЛИ ===
  // ==========================================================
  const renderRiskBody = (rd, isLoading, alwaysExpanded, expanded, onToggle) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
          <p className="text-[var(--text-primary)] font-medium">Сбор данных из блокчейна...</p>
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center px-4">Анализируем смарт-контракт, кошельки холдеров и DEX пулы</p>
        </div>
      );
    }
    if (!rd) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <ShieldCheck size={40} className="opacity-30 mb-3" />
          <p className="text-sm">Выберите токен для анализа</p>
        </div>
      );
    }
    if (rd.isSafeDefault) {
      return (
        <div className="mt-4 flex items-center gap-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-medium text-emerald-400">{rd.message}</span>
        </div>
      );
    }
    if (rd.error) {
      return (
        <div className="mt-4 flex items-center gap-3 bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
          <ShieldAlert size={20} className="text-rose-500 shrink-0" />
          <span className="text-sm text-rose-400">{rd.message}</span>
        </div>
      );
    }

    const sec = rd.security_analysis;
    const v = sec ? sec.verdict : null;
    const m = sec ? sec.metrics : null;
    const market = (m && m.market_dynamics) ? m.market_dynamics.metrics : null;
    const creator = m ? m.creator_analysis : null;
    const whales = m ? m.whale_analysis : null;

    const showDetails = alwaysExpanded || expanded;

    return (
      <div className="space-y-4">
        <div className={`p-5 rounded-2xl border ${(v && v.score < 30) ? 'bg-emerald-500/5 border-emerald-500/20' : (v && v.score < 70) ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-[var(--text-muted)]">Индекс риска</div>
            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${(v && v.score < 30) ? 'bg-emerald-500/20 text-emerald-400' : (v && v.score < 70) ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {(v && v.level) ? v.level : 'Анализ завершен'}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-5xl font-extrabold ${(v && v.score < 30) ? 'text-emerald-500' : (v && v.score < 70) ? 'text-amber-500' : 'text-rose-500'}`}>
              {(v && v.score) ? v.score : '0'}
            </span>
            <span className="text-[var(--text-muted)] mb-1 font-medium">/ 100</span>
          </div>
        </div>

        {!alwaysExpanded && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] py-1 transition-colors"
          >
            {expanded ? 'Свернуть' : 'Подробный анализ'}
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}

        {showDetails && (
          <div className="space-y-6">
            {market && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" /> Динамика рынка
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[var(--bg-item)] p-3 rounded-xl border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Droplet size={12}/> Ликвидность</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{market.liquidity_usd ? market.liquidity_usd : "—"}</div>
                  </div>
                  <div className="bg-[var(--bg-item)] p-3 rounded-xl border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><TrendingUp size={12}/> Объем (24ч)</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{market.volume_24h ? market.volume_24h : "—"}</div>
                  </div>
                  <div className="bg-[var(--bg-item)] p-3 rounded-xl border border-[var(--border)] col-span-2">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Изменение цены (24ч)</div>
                    <div className={`text-sm font-bold ${(market.price_change_24h && market.price_change_24h.includes('-')) ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {market.price_change_24h ? market.price_change_24h : "0.00%"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {creator && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <UserMinus size={14} className="text-purple-400" /> Анализ разработчика
                </h4>
                <div className="bg-[var(--bg-item)] p-4 rounded-xl border border-[var(--border)] space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-muted)]">Продано создателем</span>
                    <span className={`font-bold ${creator.dumped_percent > 80 ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>{creator.dumped_percent}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-muted)]">Урон ликвидности</span>
                    <span className="font-bold text-[var(--text-primary)]">{creator.impact_percent}%</span>
                  </div>
                  {creator.dev_dump_risk && (
                    <div className="mt-2 text-xs bg-rose-500/10 text-rose-400 px-3 py-2 rounded-lg border border-rose-500/20">
                      ⚠️ Высокий риск дампа разработчика
                    </div>
                  )}
                </div>
              </div>
            )}

            {whales && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <PieChart size={14} className="text-cyan-400" /> Распределение китов
                </h4>
                <div className="bg-[var(--bg-item)] p-4 rounded-xl border border-[var(--border)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-[var(--text-muted)]">Доля ТОП-10 кошельков</span>
                    <span className={`text-sm font-bold px-2 py-1 rounded-md ${whales.is_whale_manipulation_risk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {whales.top_private_percent}%
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {(whales.whales_list && whales.whales_list.length > 0) ? whales.whales_list.map((w, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-[var(--border)] pb-1 last:border-0">
                        <span className="text-slate-500 font-mono bg-[var(--bg-card)] px-1.5 py-0.5 rounded">{formatAddress(w.address)}</span>
                        <span className="text-[var(--text-primary)]">{w.percent}%</span>
                      </div>
                    )) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              {(v && v.warnings && v.warnings.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Найдены риски
                  </h4>
                  <div className="space-y-2">
                    {v.warnings.map((warn, idx) => (
                      <div key={idx} className="flex gap-3 items-start bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--text-primary)] leading-snug">{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(v && v.safe_metrics && v.safe_metrics.length > 0) && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Позитивные индикаторы
                  </h4>
                  <div className="space-y-2">
                    {v.safe_metrics.map((metric, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-2">
                        <Check size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-[var(--text-muted)]">{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================================
  // === RENDER ===
  // ==========================================================

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      <style>{scrollbarStyles}</style>

      {/* === НОТИФИКАЦИИ === */}
      <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border w-80 animate-in slide-in-from-right-8 fade-in duration-300 ${n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/20 shadow-emerald-900/20' : 'bg-rose-950/90 border-rose-500/20 shadow-rose-900/20'}`}>
            {n.type === 'success' ? <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} /> : <XCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />}
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${n.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {n.type === 'success' ? 'Транзакция успешна' : 'Ошибка транзакции'}
              </h4>
              <p className="text-xs text-slate-300 mt-1 break-words">{n.message}</p>
              {n.hash && (
                <a href={`https://bscscan.com/tx/${n.hash}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors mt-2 flex items-center gap-1 w-max">
                  Смотреть в эксплорере <ExternalLink size={10} />
                </a>
              )}
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-slate-500 hover:text-white transition-colors">
              <X size={16}/>
            </button>
          </div>
        ))}
      </div>

      {/* === ФИКСИРОВАННАЯ ШАПКА === */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-base)]/85 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">R</div>
            <div className="hidden sm:block text-base font-extrabold text-[var(--text-primary)] tracking-tight">Risk Engine</div>
          </div>

          <nav className="flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border)]">
            {[
              { id: 'analyze', label: 'Анализ',   icon: BarChart3 },
              { id: 'swap',    label: 'Своп',     icon: ArrowRightLeft },
              { id: 'learn',   label: 'Обучение', icon: GraduationCap },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsDark(d => !d)}
              className="w-9 h-9 rounded-xl border flex items-center justify-center
                         bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]
                         hover:text-[var(--text-primary)] transition-colors"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {activeTab === 'swap' && <ConnectKitButton />}
          </div>
        </div>
      </header>

      {/* === ОСНОВНОЙ КОНТЕНТ ПО ВКЛАДКАМ === */}
      <main className="pt-24 pb-10 px-4 w-full">

        {/* ========================== */}
        {/* === ВКЛАДКА: АНАЛИЗ === */}
        {/* ========================== */}
        {activeTab === 'analyze' && (
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
                Анализатор рисков токена
              </h1>
              <p className="text-[var(--text-muted)] text-sm sm:text-base">
                Проверьте любой токен на признаки скама — без подключения кошелька
              </p>
            </div>

            <div className="bg-[var(--bg-card)] rounded-3xl p-5 border border-[var(--border)] shadow-2xl mb-6">
              <div className="flex gap-2 relative">
                <div className="flex-1 bg-[var(--bg-item)] border border-[var(--border)] rounded-2xl flex items-center px-4 gap-3 focus-within:border-blue-500 transition-colors">
                  <Search size={20} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={analyzerQuery}
                    onChange={(e) => { setAnalyzerQuery(e.target.value); setAnalyzerDropdownOpen(true); }}
                    onFocus={() => setAnalyzerDropdownOpen(true)}
                    placeholder="Адрес контракта (0x...) или название токена"
                    className="bg-transparent w-full py-3.5 outline-none text-[var(--text-primary)] placeholder-slate-400 text-sm"
                  />
                  {analyzerQuery && (
                    <button onClick={() => { setAnalyzerQuery(''); setAnalyzerSearchResults([]); }} className="text-slate-400 hover:text-[var(--text-primary)]">
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsAnalyzerNetworkOpen(o => !o)}
                  className="bg-[var(--bg-item)] border border-[var(--border)] rounded-2xl px-4 flex items-center gap-2 hover:border-blue-500 transition-colors shrink-0 relative"
                >
                  <span className="text-lg">{analyzerNetwork.icon}</span>
                  <span className="hidden sm:block text-sm font-semibold text-[var(--text-primary)]">{analyzerNetwork.name}</span>
                  <ChevronDown size={16} className="text-slate-500" />
                  {isAnalyzerNetworkOpen && (
                    <div className="absolute top-[110%] right-0 w-[180px] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                      {ANALYZER_NETWORKS.map(net => (
                        <div
                          key={net.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalyzerNetwork(net);
                            setIsAnalyzerNetworkOpen(false);
                            // Полный сброс состояния поиска при смене сети,
                            // иначе старый запрос перезапускается на новой сети
                            // и пользователь видит результаты для неправильной сети
                            setAnalyzerToken(null);
                            setAnalyzerRiskData(null);
                            setAnalyzerQuery('');
                            setAnalyzerSearchResults([]);
                            setAnalyzerDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 p-3 hover:bg-[var(--bg-input)] transition cursor-pointer ${analyzerNetwork.id === net.id ? 'bg-[var(--bg-input)]' : ''}`}
                        >
                          <span className="text-xl">{net.icon}</span>
                          <span className="font-bold text-sm text-[var(--text-primary)]">{net.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              </div>

              {analyzerDropdownOpen && analyzerQuery.trim().length >= 2 && (
                <div className="mt-3 max-h-[320px] overflow-y-auto custom-scrollbar bg-[var(--bg-item)] border border-[var(--border)] rounded-2xl">
                  {isAnalyzerSearching ? (
                    <div className="p-6 flex items-center justify-center text-blue-400">
                      <Loader2 className="animate-spin mr-2" size={18} /> Поиск в DexScreener...
                    </div>
                  ) : analyzerSearchResults.length > 0 ? (
                    analyzerSearchResults.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => { setAnalyzerToken(t); setAnalyzerDropdownOpen(false); setAnalyzerQuery(`${t.symbol} — ${formatAddress(t.address)}`); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-input)] transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white font-bold">
                            {t.symbol[0]}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">{t.name}</div>
                            <div className="text-xs text-[var(--text-muted)] font-mono">{t.symbol} · {formatAddress(t.address)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[var(--text-primary)]">
                            {t.price_usd ? `$${t.price_usd.toFixed(t.price_usd < 0.01 ? 8 : 4)}` : '—'}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {t.liquidity_usd ? `Liq: $${formatNumber(t.liquidity_usd, 0)}` : ''}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                      Ничего не найдено в выбранной сети
                    </div>
                  )}
                </div>
              )}
            </div>

            {analyzerToken ? (
              <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between gap-3 p-6 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <ShieldCheck className="text-blue-500" size={26} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {(analyzerRiskData?.token_info?.name) || analyzerToken.name}
                        {' '}
                        <span className="text-[var(--text-muted)] font-medium">
                          ({(analyzerRiskData?.token_info?.symbol) || analyzerToken.symbol})
                        </span>
                      </h3>
                      <a
                        href={
                          analyzerToken.chain_id === '1' ? `https://etherscan.io/token/${analyzerToken.address}` :
                          analyzerToken.chain_id === '56' ? `https://bscscan.com/token/${analyzerToken.address}` :
                          `https://basescan.org/token/${analyzerToken.address}`
                        }
                        target="_blank" rel="noreferrer"
                        className="text-xs text-[var(--text-muted)] font-mono mt-1 flex items-center gap-1 hover:text-blue-400 transition-colors"
                      >
                        {formatAddress(analyzerToken.address)} <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAnalyzerToken(null); setAnalyzerRiskData(null); setAnalyzerQuery(''); }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-xl transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6">
                  {renderRiskBody(analyzerRiskData, isAnalyzerRiskLoading, true, true, null)}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <ShieldCheck size={56} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-1">Введите адрес токена или его название</p>
                <p className="text-sm">Risk Engine проверит контракт через GoPlus, Moralis и DexScreener</p>
              </div>
            )}
          </div>
        )}

        {/* ========================== */}
        {/* === ВКЛАДКА: СВОП === */}
        {/* ========================== */}
        {activeTab === 'swap' && (
          <div className="flex flex-col lg:flex-row justify-center items-start gap-6 w-full max-w-[1000px] mx-auto transition-all duration-500">

            <div className="w-full max-w-[480px] shrink-0 transition-all duration-500 mx-auto lg:mx-0 lg:sticky lg:top-20">

              <div className="bg-[var(--bg-card)] rounded-t-3xl p-5 pb-10 relative border border-[var(--border)] border-b-0 shadow-2xl focus-within:border-blue-500/50 transition-colors">

                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Продать</div>
                  {isConnected && address && (
                    <button
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="text-xs font-semibold text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-blue-500/10"
                    >
                      <Clock size={14} /> История
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="bg-transparent text-4xl w-1/2 outline-none placeholder-[var(--border)] text-[var(--text-primary)] font-medium"
                  />
                  <button
                    onClick={() => openModal('pay')}
                    className="flex items-center gap-2 bg-[var(--bg-input)] hover:bg-[var(--border)] px-4 py-2 rounded-2xl font-semibold transition-all border border-[var(--border)] shrink-0 text-[var(--text-primary)]"
                  >
                    {payToken ? (
                      <>
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">
                          {payToken.symbol.charAt(0)}
                        </div>
                        <span>{payToken.symbol}</span>
                      </>
                    ) : <span>Выбрать</span>}
                    <ChevronDown size={18} className="text-slate-400" />
                  </button>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-muted)] mt-3 font-medium px-1">
                  <span>{payUsdDisplay}</span>
                  <span>Баланс: {payToken ? formatBalanceDisplay(payBalanceNum) : '0.00'}</span>
                </div>
                {payToken && payBalanceNum > 0 && (
                  <div className="flex gap-1.5 mt-2 px-1">
                    {[25, 50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setPayAmount((payBalanceNum * pct / 100).toFixed(6))}
                        className="flex-1 text-xs font-semibold py-1 rounded-lg bg-[var(--bg-input)] hover:bg-blue-500/20 hover:text-blue-400 text-[var(--text-muted)] border border-[var(--border)] transition-colors"
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  onClick={handleSwapSides}
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-11 h-11 bg-[var(--bg-card)] border-4 border-[var(--bg-base)] rounded-2xl flex items-center justify-center z-10 cursor-pointer hover:scale-110 hover:bg-[var(--bg-input)] transition-all shadow-lg group"
                >
                  <ArrowDown size={20} className="text-blue-500 group-hover:text-blue-400" />
                </div>
              </div>

              <div className="bg-[var(--bg-card)] rounded-b-3xl p-5 pt-10 border border-[var(--border)] border-t-0 mt-1 shadow-2xl">
                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Купить</div>
                <div className="flex justify-between items-center">

                  <input
                    type="text"
                    placeholder="0"
                    value={isQuoteLoading ? "..." : (quoteData && !quoteData.error && quoteData.expected_output_human ? formatNumber(quoteData.expected_output_human, 6) : "")}
                    readOnly
                    className={`bg-transparent text-4xl w-1/2 outline-none placeholder-[var(--border)] font-medium cursor-not-allowed ${isQuoteLoading ? 'animate-pulse text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}
                  />

                  {/* === ИСПРАВЛЕНО: text-white применяется ТОЛЬКО когда токен не выбран === */}
                  <button
                    onClick={() => openModal('receive')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-lg shrink-0 ${
                      receiveToken
                        ? 'bg-[var(--bg-input)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)]'
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 text-white'
                    }`}
                  >
                    {receiveToken ? (
                      <>
                        <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] text-white">
                          {displayReceiveSymbol?.charAt(0)}
                        </div>
                        <span>{displayReceiveSymbol}</span>
                      </>
                    ) : <span>Выбрать токен</span>}
                    <ChevronDown size={18} />
                  </button>
                </div>

                <div className="flex justify-between text-sm text-[var(--text-muted)] mt-3 font-medium px-1">
                  <span>{receiveUsdDisplay}</span>
                  <span>Баланс: {receiveToken ? formatBalanceDisplay(receiveBalanceNum) : '0.00'}</span>
                </div>
              </div>

              {(!isConnected && !isConnecting && !isReconnecting) ? (
                <div className="mt-5 flex justify-center [&>button]:w-full [&>button]:py-4 [&>button]:rounded-2xl [&>button]:text-lg [&>button]:font-bold [&>button]:shadow-xl">
                  <ConnectKitButton.Custom>
                    {({ show }) => <button onClick={show} className="bg-blue-600 hover:bg-blue-500 transition-all active:scale-[0.98] text-white">Подключить кошелек</button>}
                  </ConnectKitButton.Custom>
                </div>
              ) : (isConnecting || isReconnecting) ? (
                <button disabled className="w-full bg-[var(--bg-input)] text-[var(--text-muted)] font-bold text-lg py-4 rounded-2xl mt-5 shadow-none cursor-not-allowed flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Загрузка кошелька...
                </button>
              ) : (
                <>
                  {isWarningPriceImpact && !isLiquidityError && !isQuoteLoading && quoteData && !quoteData.error && (
                    <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-3 items-start animate-in fade-in">
                      <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                      <div className="text-sm text-rose-400 leading-snug">
                        <strong className="block mb-1">Высокое проскальзывание!</strong>
                        Ожидаемые потери стоимости: ~{priceImpact.toFixed(1)}%. Выполняйте обмен под свою ответственность.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={isSwapDisabled}
                    className={`w-full font-bold text-lg rounded-2xl mt-5 shadow-xl transition-all active:scale-[0.98] py-4 flex justify-center items-center gap-2 ${
                      isWarningPriceImpact && !isSwapDisabled
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 disabled:bg-[var(--bg-input)] disabled:text-[var(--text-muted)] disabled:shadow-none disabled:cursor-not-allowed text-white shadow-blue-600/20'
                    }`}
                  >
                    {getButtonText()}
                  </button>
                </>
              )}
            </div>

            {receiveToken && (
              <div className="w-full max-w-[480px] shrink-0 bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] flex flex-col shadow-2xl animate-in slide-in-from-right-8 fade-in duration-500 mx-auto lg:mx-0 max-h-[85vh] overflow-hidden">

                <div className="flex items-center gap-3 p-6 pb-4 bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-10 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Анализ {displayReceiveSymbol}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-1">{formatAddress(receiveToken.address)}</p>
                  </div>
                </div>

                <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                  {renderRiskBody(riskData, isRiskLoading, false, isRiskExpanded, () => setIsRiskExpanded(e => !e))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================== */}
        {/* === ВКЛАДКА: ОБУЧЕНИЕ === */}
        {/* ========================== */}
        {activeTab === 'learn' && (
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
                Обучение безопасной работе в DeFi
              </h1>
              <p className="text-[var(--text-muted)] text-sm sm:text-base">
                Узнайте, как распознать скам токены, rug pull и другие угрозы прежде, чем потерять деньги
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <aside className="w-full md:w-64 shrink-0">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 md:sticky md:top-20">
                  {LEARN_SECTIONS.map(section => (
                    <div key={section.label} className="mb-4 last:mb-0">
                      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-2">
                        {section.label}
                      </h3>
                      <div className="space-y-1">
                        {section.ids.map(id => {
                          const isActive = activeLearnArticle === id;
                          return (
                            <button
                              key={id}
                              onClick={() => setActiveLearnArticle(id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isActive
                                  ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
                              }`}
                            >
                              {LEARN_ARTICLES[id].title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <article className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-10 shadow-xl min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight">
                  {LEARN_ARTICLES[activeLearnArticle].title}
                </h1>
                {LEARN_ARTICLES[activeLearnArticle].content}

                <div className="mt-12 pt-6 border-t border-[var(--border)] flex justify-between items-center text-sm">
                  <button
                    onClick={() => setActiveTab('analyze')}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <BarChart3 size={15} /> Перейти к анализатору
                  </button>
                  <button
                    onClick={() => setActiveTab('swap')}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Безопасный своп <ChevronRight size={15} />
                  </button>
                </div>
              </article>
            </div>
          </div>
        )}

      </main>

      {/* === МОДАЛЬНОЕ ОКНО ПОИСКА ТОКЕНОВ (своп) === */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-[440px] h-[640px] rounded-[32px] border border-[var(--border)] flex flex-col relative shadow-2xl overflow-hidden">
            <div className="p-6 pb-2 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Выберите токен {modalMode === 'pay' ? 'для продажи' : 'для покупки'}</h2>
              <button onClick={() => setModalMode(null)} className="bg-[var(--bg-input)] p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex gap-2 relative">
              <div className="flex-1 bg-[var(--bg-item)] border border-[var(--border)] rounded-2xl flex items-center px-4 gap-3 focus-within:border-blue-500 transition-colors">
                <Search size={20} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название или контракт (0x...)"
                  className="bg-transparent w-full py-3.5 outline-none text-[var(--text-primary)] placeholder-slate-400 text-sm"
                />
              </div>

              <button
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                className="bg-[var(--bg-item)] border border-[var(--border)] rounded-2xl px-4 flex items-center gap-1 hover:border-blue-500 transition-colors shrink-0 relative"
              >
                <span className="text-lg">{selectedNetwork.icon}</span>
                <ChevronDown size={16} className="text-slate-500" />

                {isNetworkDropdownOpen && (
                  <div className="absolute top-[110%] right-0 w-[200px] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                    {MOCK_NETWORKS.map(net => (
                      <div
                        key={net.id}
                        onClick={(e) => { e.stopPropagation(); handleNetworkChange(net); }}
                        className={`flex items-center gap-3 p-3 hover:bg-[var(--bg-input)] transition text-left cursor-pointer ${selectedNetwork.id === net.id ? 'bg-[var(--bg-input)]' : ''}`}
                      >
                        <span className="text-xl">{net.icon}</span>
                        <span className="font-bold text-sm text-[var(--text-primary)]">{net.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
              <div className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} /> {searchQuery ? "Результаты поиска" : "Ваши активы"}
              </div>

              {(!isConnected && !isConnecting && !isReconnecting) ? (
                <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)] text-center px-8">
                  <Wallet size={48} className="mb-4 opacity-50" />
                  <p>Подключите кошелек, чтобы увидеть свои активы в сети</p>
                </div>
              ) : (
                <>
                  {isConnecting || isReconnecting || isSearching || isLoadingAssets ? (
                    <div className="flex flex-col items-center justify-center p-10 text-blue-400">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <span className="text-sm font-medium">
                        {(isConnecting || isReconnecting)
                          ? "Восстановление сессии кошелька..."
                          : isSearching
                            ? "Глобальный поиск..."
                            : "Загрузка портфеля..."}
                      </span>
                    </div>
                  ) : displayAssets.length > 0 ? (
                    displayAssets.map((token, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectToken(token)}
                        className={`w-full flex items-center justify-between p-4 hover:bg-[var(--bg-input)]/80 rounded-2xl transition-all text-left mx-auto group ${token.isSpam ? 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`relative w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-inner group-hover:scale-110 transition-transform ${token.isNative ? 'bg-blue-600' : 'bg-slate-700 border border-slate-600'}`}>
                            {token.symbol[0] !== 'U' ? token.symbol[0] : '🪙'}

                            <div className="absolute -bottom-1 -right-1 text-[12px] bg-[var(--bg-card)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" title={MOCK_NETWORKS.find(n => n.id === String(token.chain_id))?.name}>
                              {MOCK_NETWORKS.find(n => n.id === String(token.chain_id))?.icon || '🌐'}
                            </div>

                            {token.isCustom && (
                              <div className="absolute -top-1 -right-1 text-[10px] bg-[var(--bg-card)] rounded-full p-0.5 text-blue-400">
                                <Globe size={10} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                              {token.name}
                            </div>
                            <div className="text-xs font-medium text-[var(--text-muted)] pr-2">
                              {token.isCustom ? formatAddress(token.address) : token.symbol}
                              {token.isSpam && <span className="ml-2 text-red-400 inline-flex items-center gap-1"><AlertTriangle size={10}/> Скам</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[var(--text-primary)]">
                            {token.isCustom
                              ? 'Из поиска'
                              : Number(token.usd_value) >= 0.01
                                ? `$${Number(token.usd_value).toFixed(2)}`
                                : Number(token.usd_value) > 0
                                  ? '< $0.01'
                                  : '—'}
                          </div>
                          <div className="text-sm font-medium text-[var(--text-muted)]">
                            {token.isCustom ? 'Выбрать' : formatBalanceDisplay(Number(token.balance || 0))}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-8 text-[var(--text-muted)] text-sm">
                      По вашему запросу ничего не найдено.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ОБМЕНА === */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-[420px] rounded-[32px] border border-[var(--border)] flex flex-col relative shadow-2xl p-5 animate-in zoom-in-95 duration-200">

            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Вы выполняете своп</h2>
              <button onClick={() => !isSwapping && setIsConfirmModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition bg-[var(--bg-input)] p-1.5 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {isWarningPriceImpact && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-6 flex gap-3 items-start animate-in fade-in">
                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="text-sm text-rose-400 leading-snug">
                  <strong className="block mb-1 text-[var(--text-primary)]">Высокое влияние на цену ({priceImpact.toFixed(1)}%)</strong>
                  Вы подтверждаете, что готовы к финансовым потерям при этом обмене.
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6 px-1">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{debouncedPayAmount} {payToken?.symbol}</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1 font-medium">{payUsdDisplay}</div>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner relative">
                  {payToken?.symbol.charAt(0)}
                  <div className="absolute -bottom-1 -right-1 text-[12px] bg-[var(--bg-card)] rounded-full">🌐</div>
                </div>
              </div>

              <div className="relative flex items-center py-2">
                <div className="absolute left-0 w-full h-[1px] bg-[var(--bg-input)]"></div>
                <div className="w-8 h-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-full flex items-center justify-center relative z-10 text-[var(--text-muted)]">
                  <ArrowDown size={16} />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{formatNumber(receiveAmount, 5)} {receiveToken?.symbol}</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1 font-medium">{receiveUsdDisplay}</div>
                </div>
                <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner relative">
                  {receiveToken?.symbol.charAt(0)}
                  <div className="absolute -bottom-1 -right-1 text-[12px] bg-[var(--bg-card)] rounded-full">🌐</div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mb-6 px-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium w-full mb-4 transition-colors"
              >
                {showDetails ? 'Показать меньше' : 'Показать больше'}
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDetails && (
                <div className="space-y-3 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--text-muted)]">Курс</span>
                    <div className="text-right">
                      <div className="text-[var(--text-primary)] font-medium">1 {payToken?.symbol} = {formatNumber(receiveAmount / Number(debouncedPayAmount), 6)} {receiveToken?.symbol}</div>
                      <div className="text-[var(--text-muted)] text-xs">({getTokenPrice(payToken) > 0 ? `$${getTokenPrice(payToken).toFixed(2)}` : '$-'})</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">Макс. проскальзывание <Info size={12} className="opacity-50"/></span>
                    <span className="text-[var(--text-primary)] font-medium"><span className="bg-[var(--bg-input)] text-[var(--text-muted)] px-1.5 py-0.5 rounded text-xs mr-1 font-normal">Авто</span> 10 %</span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-[var(--text-muted)] flex items-center gap-1 mt-0.5">Маршрут <Info size={12} className="opacity-50"/></span>
                    <span className="text-blue-400 font-medium text-xs flex flex-wrap justify-end gap-1 max-w-[60%] text-right">
                      {quoteData?.route_used && quoteData.route_used.length > 0 ? quoteData.route_used.map((r, i) => (
                        <span key={i} className="bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{r}</span>
                      )) : '1inch API'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSwap}
              disabled={isSwapping}
              className={`w-full font-bold text-lg py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${
                isWarningPriceImpact
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white disabled:bg-[var(--bg-input)] disabled:text-[var(--text-muted)]'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 text-white disabled:bg-[var(--bg-input)] disabled:text-[var(--text-muted)]'
              }`}
            >
              {isSwapping ? <><Loader2 className="animate-spin" size={20} /> {swapStatus}</> : (isWarningPriceImpact ? "Понимаю риск, выполнить своп" : "Подтвердить и выполнить своп")}
            </button>
          </div>
        </div>
      )}

      {/* === МОДАЛЬНОЕ ОКНО ИСТОРИИ ОБМЕНОВ === */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-[440px] max-h-[80vh] rounded-[32px] border border-[var(--border)] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-4 flex justify-between items-center border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2"><Clock className="text-blue-500"/> История обменов</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="bg-[var(--bg-input)] p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {!hasHistory ? (
                <div className="text-center text-[var(--text-muted)] py-10 flex flex-col items-center gap-3">
                  <Clock size={40} className="opacity-20" />
                  Здесь пока ничего нет
                </div>
              ) : (
                Object.entries(groupedHistory).map(([date, txs]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 px-2">{date}</h3>
                    <div className="space-y-2">
                      {txs.map(tx => (
                        <button key={tx.id} onClick={() => setSelectedHistoryTx(tx)} className="w-full bg-[var(--bg-item)] border border-[var(--border)] hover:border-blue-500/50 p-3 rounded-xl flex justify-between items-center transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="text-[var(--text-muted)] text-xs font-mono bg-[var(--bg-input)] px-2 py-1 rounded-md">
                              {new Date(tx.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              <span className="text-[var(--text-primary)]">{tx.payAmount} {tx.paySymbol}</span>
                              <ArrowRightLeft size={12} className="text-[var(--text-muted)]" />
                              <span className="text-emerald-400">{formatNumber(tx.receiveAmount, 4)} {tx.receiveSymbol}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-blue-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* === ДЕТАЛИ ИСТОРИЧЕСКОЙ ТРАНЗАКЦИИ === */}
      {selectedHistoryTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-[380px] rounded-[24px] border border-[var(--border)] flex flex-col shadow-2xl p-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Детали обмена</h3>
              <button onClick={() => setSelectedHistoryTx(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-1.5 rounded-xl"><X size={20}/></button>
            </div>

            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <div className="text-xs text-[var(--text-muted)] font-medium bg-[var(--bg-input)] px-3 py-1 rounded-full">
                {new Date(selectedHistoryTx.timestamp).toLocaleString('ru-RU')}
              </div>
            </div>

            <div className="bg-[var(--bg-item)] border border-[var(--border)] rounded-xl p-4 space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-sm">Продано</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedHistoryTx.payAmount} {selectedHistoryTx.paySymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-sm">Получено</span>
                <span className="font-bold text-emerald-400">{formatNumber(selectedHistoryTx.receiveAmount, 6)} {selectedHistoryTx.receiveSymbol}</span>
              </div>
              {selectedHistoryTx.priceImpact > 0 && (
                <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-sm">Проскальзывание</span>
                  <span className="text-rose-400 font-medium text-sm">{selectedHistoryTx.priceImpact.toFixed(2)}%</span>
                </div>
              )}
              <div className="flex justify-between items-start pt-3 border-t border-[var(--border)]">
                <span className="text-[var(--text-muted)] text-sm mt-0.5">Маршрут</span>
                <div className="flex flex-wrap justify-end gap-1 max-w-[60%]">
                  {selectedHistoryTx.route.map((r, i) => (
                    <span key={i} className="text-[10px] font-medium bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{r}</span>
                  ))}
                </div>
              </div>
            </div>

            {selectedHistoryTx.hash && (
              <a href={`https://bscscan.com/tx/${selectedHistoryTx.hash}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-[var(--bg-input)] hover:bg-[var(--border)] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[var(--text-primary)] transition-colors">
                Проверить в Explorer <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
