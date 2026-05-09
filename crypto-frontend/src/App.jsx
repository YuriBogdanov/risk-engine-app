import { useState, useEffect, useMemo } from 'react';
import { ConnectKitButton } from "connectkit";
import { 
  ChevronDown, ChevronUp, ChevronRight, Search, X, ArrowDown, Settings, Wallet, 
  AlertTriangle, ShieldCheck, ShieldAlert, Activity, Info, 
  CheckCircle2, CheckCircle, XCircle, Loader2, ArrowRightLeft, Droplet, TrendingUp, 
  UserMinus, PieChart, Check, Globe, Clock, ExternalLink
} from 'lucide-react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseUnits } from 'viem';

const MOCK_NETWORKS = [
  { id: 'all', name: 'Все сети', icon: '🌐' },
  { id: '1', name: 'Ethereum', icon: '⟠' },
  { id: '56', name: 'BNB Chain', icon: '🟨' },
  { id: '8453', name: 'Base', icon: '🔵' },
];

const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null) return '—';
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
};

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #334155;
  }
`;

function App() {
  const [modalMode, setModalMode] = useState(null); 
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(MOCK_NETWORKS[0]); 
  
  const [searchQuery, setSearchQuery] = useState(''); 
  const [globalSearchAssets, setGlobalSearchAssets] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [payToken, setPayToken] = useState(null);
  const [receiveToken, setReceiveToken] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { sendTransactionAsync } = useSendTransaction(); 
  
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

  const addNotification = (message, type = 'success', hash = null) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, hash }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // === ИСПРАВЛЕНО: Группировка истории СТРОГО по текущему кошельку ===
  const groupedHistory = useMemo(() => {
    if (!address) return {}; // Если нет кошелька, отдаем пустой объект
    
    // Фильтруем транзакции только для текущего пользователя
    const userTxs = swapHistory.filter(tx => tx.userWallet && tx.userWallet.toLowerCase() === address.toLowerCase());
    
    return userTxs.reduce((acc, tx) => {
        const date = new Date(tx.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(tx);
        return acc;
    }, {});
  }, [swapHistory, address]);
  
  const hasHistory = Object.keys(groupedHistory).length > 0;
  // ====================================================================

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

  // 1. Проверяем, совпадает ли текущий ввод с тем, что ушло в обработку (защита от "мигания")
  const isSyncing = payAmount !== debouncedPayAmount;

  // Используем debouncedPayAmount для расчетов "в фоне"
  const payUsd = debouncedPayAmount ? (Number(debouncedPayAmount) * getTokenPrice(payToken)) : 0;

  // Оставляем payAmount только для визуального отображения цены под инпутом
  const payUsdDisplay = payAmount ? `$${(Number(payAmount) * getTokenPrice(payToken)).toFixed(2)}` : '$-';

  const receiveAmount = (quoteData && !quoteData.error && !isQuoteLoading) ? Number(quoteData.expected_output_human) : 0;
  const receiveUsd = receiveAmount ? (receiveAmount * getTokenPrice(receiveToken)) : 0;
  const receiveUsdDisplay = receiveUsd > 0 ? `$${receiveUsd.toFixed(2)}` : '$-';

  const poolLiquidity = riskData?.security_analysis?.verdict?.total_liquidity_usd || 0;
  const isLiquidityError = poolLiquidity > 0 && payUsd > poolLiquidity;

  // 2. Рассчитываем Price Impact
  const priceImpact = (!isQuoteLoading && !isSyncing && payUsd > 0 && receiveUsd > 0) 
    ? ((payUsd - receiveUsd) / payUsd * 100) 
    : 0;

  // 3. Варнинг появляется ТОЛЬКО если:
  // - Загрузка завершена (!isQuoteLoading)
  // - Пользователь перестал печатать (!isSyncing)
  // - Проскальзывание реально больше 10%
  const isWarningPriceImpact = !isQuoteLoading && !isSyncing && priceImpact > 10;

  const getButtonText = () => {
    if (!payAmount || Number(payAmount) <= 0) return "Введите сумму";
    if (!receiveToken) return "Выберите токен";
    if (isQuoteLoading) return "Поиск лучшей цены..."; // Добавлено состояние загрузки для текста
    if (isLiquidityError) return "Превышена ликвидность пула";
    if (!quoteData || quoteData.error) return "Маршрут не найден";
    if (isWarningPriceImpact) return `Опасный обмен (${priceImpact.toFixed(1)}%)`;
    return "Обмен";
  };

  const isSwapDisabled = !payToken || !receiveToken || !payAmount || Number(payAmount) <= 0 || isSwapping || isQuoteLoading || !quoteData || !!quoteData.error || isLiquidityError;

  useEffect(() => {
    if (backendData && backendData.assets && backendData.assets.length > 0 && !payToken && !receiveToken) {
      const nativeAsset = backendData.assets.find(t => t.isNative);
      if (nativeAsset) setPayToken(nativeAsset);
    }
  }, [backendData, payToken, receiveToken]);

  const fetchAssets = async (networkId = selectedNetwork.id) => {
    if (!address) return;
    setIsLoadingAssets(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/assets/${networkId}/${address}`);
      const data = await response.json();
      setBackendData(data);
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
        
        if (!response.ok) {
           throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
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

    const riskTimer = setTimeout(() => {
      fetchRisk();
    }, 600); 

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
    let intervalId;

    const fetchQuote = async (isBackgroundRefresh = false) => {
      if (!payToken || !receiveToken || !debouncedPayAmount || Number(debouncedPayAmount) <= 0) {
        setQuoteData(null);
        return;
      }

      if (!isBackgroundRefresh) setIsQuoteLoading(true);
      
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
      intervalId = setInterval(() => {
        fetchQuote(true); 
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
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
      const decimals = payToken.decimals || 18; 
      const amountWei = parseUnits(payAmount, decimals).toString();

      const reqBody = {
        chainId: "56", 
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
        setSwapStatus('Ожидание Approve в MetaMask...');
        await sendTransactionAsync({
          to: approveData.tx.to,
          data: approveData.tx.data,
          value: approveData.tx.value ? BigInt(approveData.tx.value) : 0n
        });
        
        setSwapStatus('Approve отправлен! Ждем блокчейн...');
        await new Promise(r => setTimeout(r, 4000)); 
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
      });

      // === СОХРАНЕНИЕ В ИСТОРИЮ С ПРИВЯЗКОЙ К КОШЕЛЬКУ ===
      const newHistoryTx = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userWallet: address, // Сохраняем кошелек, с которого был обмен!
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

  const security = riskData ? riskData.security_analysis : null;
  const verdict = security ? security.verdict : null;
  const metrics = security ? security.metrics : null;
  const market = (metrics && metrics.market_dynamics) ? metrics.market_dynamics.metrics : null;
  const creator = metrics ? metrics.creator_analysis : null;
  const whales = metrics ? metrics.whale_analysis : null;

  const displayReceiveSymbol = (riskData && !isRiskLoading && riskData.token_info?.symbol && riskData.token_info.symbol !== 'Unknown') 
    ? riskData.token_info.symbol 
    : receiveToken?.symbol;

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col p-4 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      <style>{scrollbarStyles}</style>
      
      {/* === БЛОК УВЕДОМЛЕНИЙ (ТОСТЫ) === */}
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

      <div className="absolute top-6 right-6 z-10">
        <ConnectKitButton />
      </div>
      
      <div className="flex flex-col lg:flex-row justify-center items-start gap-6 w-full max-w-[1000px] mx-auto mt-20 transition-all duration-500">
        
        {/* === ЛЕВАЯ ЧАСТЬ: ИНТЕРФЕЙС ОБМЕНА === */}
        <div className={`w-full max-w-[480px] shrink-0 transition-all duration-500 mx-auto lg:mx-0 sticky top-20`}>
          
          <div className="bg-[#0f172a] rounded-t-3xl p-5 pb-10 relative border border-[#1e293b] border-b-0 shadow-2xl focus-within:border-blue-500/50 transition-colors">
            
            {/* === ИЗМЕНЕНО: Кнопка вызова истории обменов ПОКАЗЫВАЕТСЯ ТОЛЬКО ПРИ ПОДКЛЮЧЕННОМ КОШЕЛЬКЕ === */}
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Продать</div>
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
                className="bg-transparent text-4xl w-1/2 outline-none placeholder-slate-700 font-medium"
              />
              <button 
                onClick={() => openModal('pay')}
                className="flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] px-4 py-2 rounded-2xl font-semibold transition-all border border-slate-700 shrink-0"
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
            <div className="flex justify-between text-sm text-slate-500 mt-3 font-medium px-1">
              <span>{payUsdDisplay}</span> 
              <span>Баланс: {payToken ? (payToken.isCustom ? '0.00' : payToken.balance) : '0.00'}</span>
            </div>

            <div 
              onClick={handleSwapSides}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-11 h-11 bg-[#0f172a] border-4 border-[#05070a] rounded-2xl flex items-center justify-center z-10 cursor-pointer hover:scale-110 hover:bg-[#1e293b] transition-all shadow-lg group"
            >
              <ArrowDown size={20} className="text-blue-500 group-hover:text-blue-400" />
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-b-3xl p-5 pt-10 border border-[#1e293b] border-t-0 mt-1 shadow-2xl">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Купить</div>
            <div className="flex justify-between items-center">
              
              <input 
                type="text" 
                placeholder="0" 
                value={isQuoteLoading ? "..." : (quoteData && !quoteData.error && quoteData.expected_output_human ? formatNumber(quoteData.expected_output_human, 6) : "")}
                readOnly
                className={`bg-transparent text-4xl w-1/2 outline-none placeholder-slate-700 font-medium cursor-not-allowed ${isQuoteLoading ? 'animate-pulse text-slate-500' : 'text-white'}`}
              />

              <button 
                onClick={() => openModal('receive')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all text-white shadow-lg shrink-0 ${receiveToken ? 'bg-[#1e293b] hover:bg-[#334155] border border-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
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
            
            <div className="flex justify-between text-sm text-slate-500 mt-3 font-medium px-1">
              <span>{receiveUsdDisplay}</span>
              <span>Баланс: {receiveToken ? (receiveToken.isCustom ? '0.00' : receiveToken.balance) : '0.00'}</span>
            </div>
          </div>

          {(!isConnected && !isConnecting && !isReconnecting) ? (
            <div className="mt-5 flex justify-center [&>button]:w-full [&>button]:py-4 [&>button]:rounded-2xl [&>button]:text-lg [&>button]:font-bold [&>button]:shadow-xl">
               <ConnectKitButton.Custom>
                {({ show }) => <button onClick={show} className="bg-blue-600 hover:bg-blue-500 transition-all active:scale-[0.98]">Подключить кошелек</button>}
              </ConnectKitButton.Custom>
            </div>
          ) : (isConnecting || isReconnecting) ? (
            <button disabled className="w-full bg-slate-800 text-slate-500 font-bold text-lg py-4 rounded-2xl mt-5 shadow-none cursor-not-allowed flex items-center justify-center gap-2">
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
                    : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-white shadow-blue-600/20'
                }`}
              >
                {getButtonText()}
              </button>
            </>
          )}
        </div>

        {/* === ПРАВАЯ ЧАСТЬ: ДЕТАЛЬНАЯ ПАНЕЛЬ АНАЛИЗА РИСКОВ === */}
        {receiveToken && (
          <div className="w-full max-w-[480px] shrink-0 bg-[#0f172a] rounded-[32px] border border-[#1e293b] flex flex-col shadow-2xl animate-in slide-in-from-right-8 fade-in duration-500 mx-auto lg:mx-0 max-h-[85vh] overflow-hidden">
            
            <div className="flex items-center gap-3 p-6 pb-4 bg-[#0f172a] border-b border-[#1e293b] sticky top-0 z-10 shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Анализ {displayReceiveSymbol}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{formatAddress(receiveToken.address)}</p>
              </div>
            </div>

            <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar">
              {isRiskLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                  <p className="text-slate-300 font-medium">Сбор данных из блокчейна...</p>
                  <p className="text-xs text-slate-500 mt-2 text-center px-4">Анализируем смарт-контракт, кошельки холдеров и DEX пулы</p>
                </div>
              ) : (riskData && riskData.isSafeDefault) ? (
                <div className="mt-4 flex items-center gap-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-400">{riskData.message}</span>
                </div>
              ) : (riskData && riskData.error) ? (
                <div className="mt-4 flex items-center gap-3 bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                  <ShieldAlert size={20} className="text-rose-500 shrink-0" />
                  <span className="text-sm text-rose-400">{riskData.message}</span>
                </div>
              ) : riskData ? (
                <div className="space-y-6">
                  
                  <div className={`p-5 rounded-2xl border ${(verdict && verdict.score < 30) ? 'bg-emerald-500/5 border-emerald-500/20' : (verdict && verdict.score < 70) ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-slate-400">Индекс риска</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-lg ${(verdict && verdict.score < 30) ? 'bg-emerald-500/20 text-emerald-400' : (verdict && verdict.score < 70) ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {(verdict && verdict.level) ? verdict.level : 'Анализ завершен'}
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-5xl font-extrabold ${(verdict && verdict.score < 30) ? 'text-emerald-500' : (verdict && verdict.score < 70) ? 'text-amber-500' : 'text-rose-500'}`}>
                        {(verdict && verdict.score) ? verdict.score : '0'}
                      </span>
                      <span className="text-slate-500 mb-1 font-medium">/ 100</span>
                    </div>
                  </div>

                  {market && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-blue-400" /> Динамика рынка
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#05070a] p-3 rounded-xl border border-[#1e293b]">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Droplet size={12}/> Ликвидность</div>
                          <div className="text-sm font-bold text-white">{market.liquidity_usd ? market.liquidity_usd : "—"}</div>
                        </div>
                        <div className="bg-[#05070a] p-3 rounded-xl border border-[#1e293b]">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp size={12}/> Объем (24ч)</div>
                          <div className="text-sm font-bold text-white">{market.volume_24h ? market.volume_24h : "—"}</div>
                        </div>
                        <div className="bg-[#05070a] p-3 rounded-xl border border-[#1e293b] col-span-2">
                          <div className="text-xs text-slate-500 mb-1">Изменение цены (24ч)</div>
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
                      <div className="bg-[#05070a] p-4 rounded-xl border border-[#1e293b] space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Продано создателем</span>
                          <span className={`font-bold ${creator.dumped_percent > 80 ? 'text-rose-400' : 'text-white'}`}>{creator.dumped_percent}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Урон ликвидности</span>
                          <span className="font-bold text-white">{creator.impact_percent}%</span>
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
                      <div className="bg-[#05070a] p-4 rounded-xl border border-[#1e293b]">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-slate-400">Доля ТОП-10 кошельков</span>
                          <span className={`text-sm font-bold px-2 py-1 rounded-md ${whales.is_whale_manipulation_risk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {whales.top_private_percent}%
                          </span>
                        </div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                          {(whales.whales_list && whales.whales_list.length > 0) ? whales.whales_list.map((w, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs border-b border-[#1e293b] pb-1 last:border-0">
                              <span className="text-slate-500 font-mono bg-[#0f172a] px-1.5 py-0.5 rounded">{formatAddress(w.address)}</span>
                              <span className="text-slate-300">{w.percent}%</span>
                            </div>
                          )) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    {(verdict && verdict.warnings && verdict.warnings.length > 0) && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <AlertTriangle size={14} /> Найдены риски
                        </h4>
                        <div className="space-y-2">
                          {verdict.warnings.map((warn, idx) => (
                            <div key={idx} className="flex gap-3 items-start bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-300 leading-snug">{warn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(verdict && verdict.safe_metrics && verdict.safe_metrics.length > 0) && (
                      <div>
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CheckCircle2 size={14} /> Позитивные индикаторы
                        </h4>
                        <div className="space-y-2">
                          {verdict.safe_metrics.map((metric, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-2">
                              <Check size={16} className="text-emerald-500 shrink-0" />
                              <span className="text-sm text-slate-400">{metric}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* === МОДАЛЬНОЕ ОКНО ПОИСКА ТОКЕНОВ === */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] w-full max-w-[440px] h-[640px] rounded-[32px] border border-[#1e293b] flex flex-col relative shadow-2xl overflow-hidden">
            <div className="p-6 pb-2 flex justify-between items-center">
              <h2 className="text-xl font-bold">Выберите токен {modalMode === 'pay' ? 'для продажи' : 'для покупки'}</h2>
              <button onClick={() => setModalMode(null)} className="bg-[#1e293b] p-2 rounded-xl text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex gap-2 relative">
              <div className="flex-1 bg-[#05070a] border border-[#1e293b] rounded-2xl flex items-center px-4 gap-3 focus-within:border-blue-500 transition-colors">
                <Search size={20} className="text-slate-500 shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название или контракт (0x...)" 
                  className="bg-transparent w-full py-3.5 outline-none text-white placeholder-slate-600 text-sm"
                />
              </div>
              
              <button 
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                className="bg-[#05070a] border border-[#1e293b] rounded-2xl px-4 flex items-center gap-1 hover:border-blue-500 transition-colors shrink-0 relative"
              >
                <span className="text-lg">{selectedNetwork.icon}</span>
                <ChevronDown size={16} className="text-slate-500" />
                
                {isNetworkDropdownOpen && (
                  <div className="absolute top-[110%] right-0 w-[200px] bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                    {MOCK_NETWORKS.map(net => (
                      <div 
                        key={net.id}
                        onClick={(e) => { e.stopPropagation(); handleNetworkChange(net); }}
                        className={`flex items-center gap-3 p-3 hover:bg-[#1e293b] transition text-left cursor-pointer ${selectedNetwork.id === net.id ? 'bg-[#1e293b]' : ''}`}
                      >
                        <span className="text-xl">{net.icon}</span>
                        <span className="font-bold text-sm text-white">{net.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
              <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} /> {searchQuery ? "Результаты поиска" : "Ваши активы"}
              </div>
              
              {(!isConnected && !isConnecting && !isReconnecting) ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center px-8">
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
                        className={`w-full flex items-center justify-between p-4 hover:bg-[#1e293b]/80 rounded-2xl transition-all text-left mx-auto group ${token.isSpam ? 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`relative w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-inner group-hover:scale-110 transition-transform ${token.isNative ? 'bg-blue-600' : 'bg-slate-700 border border-slate-600'}`}>
                            {token.symbol[0] !== 'U' ? token.symbol[0] : '🪙'}
                            
                            <div className="absolute -bottom-1 -right-1 text-[12px] bg-[#0f172a] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" title={MOCK_NETWORKS.find(n => n.id === String(token.chain_id))?.name}>
                              {MOCK_NETWORKS.find(n => n.id === String(token.chain_id))?.icon || '🌐'}
                            </div>

                            {token.isCustom && (
                              <div className="absolute -top-1 -right-1 text-[10px] bg-[#0f172a] rounded-full p-0.5 text-blue-400">
                                <Globe size={10} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-2">
                              {token.name}
                            </div>
                            <div className="text-xs font-medium text-slate-400 pr-2">
                              {token.isCustom ? formatAddress(token.address) : token.symbol} 
                              {token.isSpam && <span className="ml-2 text-red-400 inline-flex items-center gap-1"><AlertTriangle size={10}/> Скам</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-100">
                            {token.isCustom ? 'Из поиска' : (token.usd_value > 0 ? `$${token.usd_value.toFixed(2)}` : '< $0.01')}
                          </div>
                          <div className="text-sm font-medium text-slate-500">
                            {token.isCustom ? 'Выбрать' : token.balance}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-8 text-slate-500 text-sm">
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
          <div className="bg-[#0f172a] w-full max-w-[420px] rounded-[32px] border border-[#1e293b] flex flex-col relative shadow-2xl p-5 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-lg font-bold text-white">Вы выполняете своп</h2>
              <button onClick={() => !isSwapping && setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-white transition bg-[#1e293b] p-1.5 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {isWarningPriceImpact && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-6 flex gap-3 items-start animate-in fade-in">
                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="text-sm text-rose-400 leading-snug">
                  <strong className="block mb-1 text-white">Высокое влияние на цену ({priceImpact.toFixed(1)}%)</strong>
                  Вы подтверждаете, что готовы к финансовым потерям при этом обмене.
                </div>
              </div>
            )}

            {/* Блок с токенами */}
            <div className="space-y-4 mb-6 px-1">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold text-white tracking-tight">{debouncedPayAmount} {payToken?.symbol}</div>
                  <div className="text-sm text-slate-500 mt-1 font-medium">{payUsdDisplay}</div>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner relative">
                  {payToken?.symbol.charAt(0)}
                  <div className="absolute -bottom-1 -right-1 text-[12px] bg-[#0f172a] rounded-full">🌐</div>
                </div>
              </div>

              <div className="relative flex items-center py-2">
                <div className="absolute left-0 w-full h-[1px] bg-[#1e293b]"></div>
                <div className="w-8 h-8 bg-[#0f172a] border border-[#1e293b] rounded-full flex items-center justify-center relative z-10 text-slate-400">
                  <ArrowDown size={16} />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold text-white tracking-tight">{formatNumber(receiveAmount, 5)} {receiveToken?.symbol}</div>
                  <div className="text-sm text-slate-500 mt-1 font-medium">{receiveUsdDisplay}</div>
                </div>
                <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner relative">
                  {receiveToken?.symbol.charAt(0)}
                  <div className="absolute -bottom-1 -right-1 text-[12px] bg-[#0f172a] rounded-full">🌐</div>
                </div>
              </div>
            </div>

            {/* Сводка транзакции (Аккордеон) */}
            <div className="border-t border-[#1e293b] pt-4 mb-6 px-1">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 font-medium w-full mb-4 transition-colors"
              >
                {showDetails ? 'Показать меньше' : 'Показать больше'}
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDetails && (
                <div className="space-y-3 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Курс</span>
                    <div className="text-right">
                       <div className="text-white font-medium">1 {payToken?.symbol} = {formatNumber(receiveAmount / Number(debouncedPayAmount), 6)} {receiveToken?.symbol}</div>
                       <div className="text-slate-500 text-xs">({getTokenPrice(payToken) > 0 ? `$${getTokenPrice(payToken).toFixed(2)}` : '$-'})</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">Макс. проскальзывание <Info size={12} className="opacity-50"/></span>
                    <span className="text-white font-medium"><span className="bg-[#1e293b] text-slate-400 px-1.5 py-0.5 rounded text-xs mr-1 font-normal">Авто</span> 10 %</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 flex items-center gap-1 mt-0.5">Маршрут <Info size={12} className="opacity-50"/></span>
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
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white disabled:bg-slate-800 disabled:text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 text-white disabled:bg-slate-800 disabled:text-slate-500'
                }`}
            >
              {isSwapping ? <><Loader2 className="animate-spin" size={20} /> {swapStatus}</> : (isWarningPriceImpact ? "Понимаю риск, выполнить своп" : "Подтвердить и выполнить своп")}
            </button>
          </div>
        </div>
      )}

      {/* === НОВОЕ МОДАЛЬНОЕ ОКНО ИСТОРИИ ОБМЕНОВ === */}
      {isHistoryModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
            <div className="bg-[#0f172a] w-full max-w-[440px] max-h-[80vh] rounded-[32px] border border-[#1e293b] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 pb-4 flex justify-between items-center border-b border-[#1e293b]">
                   <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="text-blue-500"/> История обменов</h2>
                   <button onClick={() => setIsHistoryModalOpen(false)} className="bg-[#1e293b] p-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                     <X size={20}/>
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   {!hasHistory ? (
                      <div className="text-center text-slate-500 py-10 flex flex-col items-center gap-3">
                         <Clock size={40} className="opacity-20" />
                         Здесь пока ничего нет
                      </div>
                   ) : (
                      Object.entries(groupedHistory).map(([date, txs]) => (
                         <div key={date} className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">{date}</h3>
                            <div className="space-y-2">
                               {txs.map(tx => (
                                  <button key={tx.id} onClick={() => setSelectedHistoryTx(tx)} className="w-full bg-[#05070a] border border-[#1e293b] hover:border-blue-500/50 p-3 rounded-xl flex justify-between items-center transition-all group">
                                     <div className="flex items-center gap-4">
                                        <div className="text-slate-500 text-xs font-mono bg-[#1e293b] px-2 py-1 rounded-md">
                                           {new Date(tx.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                           <span className="text-white">{tx.payAmount} {tx.paySymbol}</span>
                                           <ArrowRightLeft size={12} className="text-slate-600" />
                                           <span className="text-emerald-400">{formatNumber(tx.receiveAmount, 4)} {tx.receiveSymbol}</span>
                                        </div>
                                     </div>
                                     <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
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
            <div className="bg-[#0f172a] w-full max-w-[380px] rounded-[24px] border border-[#1e293b] flex flex-col shadow-2xl p-6 animate-in zoom-in-95 duration-200 relative">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Детали обмена</h3>
                  <button onClick={() => setSelectedHistoryTx(null)} className="text-slate-400 hover:text-white bg-[#1e293b] p-1.5 rounded-xl"><X size={20}/></button>
               </div>
               
               <div className="flex flex-col items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                     <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <div className="text-xs text-slate-500 font-medium bg-[#1e293b] px-3 py-1 rounded-full">
                     {new Date(selectedHistoryTx.timestamp).toLocaleString('ru-RU')}
                  </div>
               </div>

               <div className="bg-[#05070a] border border-[#1e293b] rounded-xl p-4 space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 text-sm">Продано</span>
                     <span className="font-bold text-white">{selectedHistoryTx.payAmount} {selectedHistoryTx.paySymbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 text-sm">Получено</span>
                     <span className="font-bold text-emerald-400">{formatNumber(selectedHistoryTx.receiveAmount, 6)} {selectedHistoryTx.receiveSymbol}</span>
                  </div>
                  {selectedHistoryTx.priceImpact > 0 && (
                     <div className="flex justify-between items-center pt-3 border-t border-[#1e293b]">
                        <span className="text-slate-500 text-sm">Проскальзывание</span>
                        <span className="text-rose-400 font-medium text-sm">{selectedHistoryTx.priceImpact.toFixed(2)}%</span>
                     </div>
                  )}
                  <div className="flex justify-between items-start pt-3 border-t border-[#1e293b]">
                     <span className="text-slate-500 text-sm mt-0.5">Маршрут</span>
                     <div className="flex flex-wrap justify-end gap-1 max-w-[60%]">
                        {selectedHistoryTx.route.map((r, i) => (
                           <span key={i} className="text-[10px] font-medium bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{r}</span>
                        ))}
                     </div>
                  </div>
               </div>

               {selectedHistoryTx.hash && (
                 <a href={`https://bscscan.com/tx/${selectedHistoryTx.hash}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-[#1e293b] hover:bg-[#334155] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-colors">
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