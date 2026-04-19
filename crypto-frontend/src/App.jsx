import { useState, useEffect, useMemo } from 'react';
import { ConnectKitButton } from "connectkit";
import { 
  ChevronDown, Search, X, ArrowDown, Settings, Wallet, 
  AlertTriangle, ShieldCheck, ShieldAlert, Activity, Info, 
  CheckCircle2, Loader2, ArrowRightLeft, Droplet, TrendingUp, 
  UserMinus, PieChart, Check, Globe
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

// Кастомные стили для скроллбара
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
  const { sendTransactionAsync } = useSendTransaction(); // <-- ХУК ДЛЯ ВЫЗОВА METAMASK
  
  const [backendData, setBackendData] = useState(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  const [riskData, setRiskData] = useState(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  
  // Состояния для процесса обмена
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState('');

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

    const fetchRisk = async () => {
      if (!receiveToken) {
        setRiskData(null);
        return;
      }
      
      if (receiveToken.isNative) {
        setRiskData({ 
          isSafeDefault: true, 
          message: "Нативная монета сети. Максимальный уровень доверия.",
          score: 0 
        });
        return;
      }

      const STABLECOINS = ['USDT', 'USDC', 'DAI', 'FDUSD', 'BUSD', 'TUSD', 'USDD'];
      if (STABLECOINS.includes(receiveToken.symbol.toUpperCase())) {
        setRiskData({
          isSafeDefault: true,
          message: "Авторизованный стейблкоин. Актив обеспечен фиатными резервами.",
          score: 1 
        });
        return;
      }

      setIsRiskLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/analyze/${receiveToken.chain_id}/${receiveToken.address}`);
        const data = await response.json();
        if (isMounted) setRiskData(data);
      } catch (error) {
        console.error("Ошибка API анализатора:", error);
        if (isMounted) setRiskData({ error: true, message: "Не удалось получить данные. Возможно токен слишком новый." });
      } finally {
        if (isMounted) setIsRiskLoading(false);
      }
    };

    fetchRisk();
    return () => { isMounted = false; };
  }, [receiveToken]);

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
    const temp = payToken;
    setPayToken(receiveToken);
    setReceiveToken(temp);
    setRiskData(null); 
  };

  // === ЛОГИКА БОЕВОГО ОБМЕНА ===
  const handleSwap = async () => {
    if (!payToken || !receiveToken || !payAmount || !address) return;
    
    setIsSwapping(true);
    setSwapStatus('Проверка разрешения...');
    
    try {
      const decimals = payToken.decimals || 18; 
      const amountWei = parseUnits(payAmount, decimals).toString();

      const reqBody = {
        // Мы принудительно шлем "56", так как 1inch работает только с реальными ID.
        // Если в будущем добавишь Ethereum, тут можно будет сделать условие.
        chainId: "56", 
        fromToken: payToken.isNative ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : payToken.address,
        toToken: receiveToken.isNative ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : receiveToken.address,
        amountWei: amountWei,
        userWallet: address
      };

      // 1. Проверяем Approve
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
        await new Promise(r => setTimeout(r, 4000)); // Пауза, чтобы сеть успела обновить данные
      }

      // 2. Запрашиваем сам Swap
      setSwapStatus('Формирование маршрута...');
      const swapRes = await fetch("http://127.0.0.1:8000/api/build-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });
      const swapData = await swapRes.json();

      if (swapData.error) throw new Error(swapData.error);

      // 3. Вызываем MetaMask для отправки обмена
      setSwapStatus('Подтвердите Swap в MetaMask...');
      const swapHash = await sendTransactionAsync({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value ? BigInt(swapData.tx.value) : 0n,
      });

      alert(`✅ Обмен успешно отправлен!\nХэш транзакции: ${swapHash}`);
      setPayAmount('');
      
    } catch (error) {
      console.error("Swap Error:", error);
      alert(`❌ Ошибка обмена: ${error.message || 'Транзакция отклонена или не хватило газа.'}`);
    } finally {
      setIsSwapping(false);
      setSwapStatus('');
    }
  };

const displayAssets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let assets = (backendData && backendData.assets) ? backendData.assets : [];
    
    // Мгновенная фильтрация по выбранной сети
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

    // === МАГИЯ ДЛЯ ПЕСОЧНИЦЫ: ИСКУССТВЕННО ДОБАВЛЯЕМ НАШ BNB ===
    if (isConnected && (selectedNetwork.id === 'all' || selectedNetwork.id === '56')) {
      const hasBnb = combined.find(t => t.symbol === 'BNB' && t.isNative);
      // Если BNB нет в списке с бэкенда, и мы не ищем что-то другое
      if (!hasBnb && (!query || 'bnb'.includes(query))) {
        combined.unshift({ // unshift ставит BNB на самое первое место
          symbol: "BNB",
          name: "BNB (Local Sandbox)",
          address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Стандарт для 1inch
          balance: "10000.00",
          usd_value: 0,
          isNative: true,
          isSpam: false,
          chain_id: '56',
          decimals: 18 // Важно для функции parseUnits
        });
      }
    }
    // ==========================================================

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
  // Не забудь добавить isConnected в массив зависимостей в конце!

  const security = riskData ? riskData.security_analysis : null;
  const verdict = security ? security.verdict : null;
  const metrics = security ? security.metrics : null;
  const market = (metrics && metrics.market_dynamics) ? metrics.market_dynamics.metrics : null;
  const creator = metrics ? metrics.creator_analysis : null;
  const whales = metrics ? metrics.whale_analysis : null;
  const trading = riskData ? riskData.trading_info : null;

  const displayReceiveSymbol = (riskData && !isRiskLoading && riskData.token_info?.symbol && riskData.token_info.symbol !== 'Unknown') 
    ? riskData.token_info.symbol 
    : receiveToken?.symbol;

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col p-4 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      <style>{scrollbarStyles}</style>
      
      <div className="absolute top-6 right-6 z-10">
        <ConnectKitButton />
      </div>
      
      <div className="flex flex-col lg:flex-row justify-center items-start gap-6 w-full max-w-[1000px] mx-auto mt-20 transition-all duration-500">
        
        {/* === ЛЕВАЯ ЧАСТЬ: ИНТЕРФЕЙС ОБМЕНА === */}
        <div className={`w-full max-w-[480px] shrink-0 transition-all duration-500 mx-auto lg:mx-0 sticky top-20`}>
          
          <div className="bg-[#0f172a] rounded-t-3xl p-5 pb-10 relative border border-[#1e293b] border-b-0 shadow-2xl focus-within:border-blue-500/50 transition-colors">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Продать</div>
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
            <div className="flex justify-between text-sm text-slate-500 mt-3 font-medium">
              <span>{(payToken && payToken.usd_value) ? `$${(payAmount * (payToken.usd_value / payToken.balance)).toFixed(2)}` : ''}</span> 
              <span>Баланс: {payToken ? payToken.balance : '0.00'}</span>
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
                readOnly
                className="bg-transparent text-4xl w-1/2 outline-none placeholder-slate-700 font-medium cursor-not-allowed"
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
            <button 
              onClick={handleSwap}
              disabled={!payToken || !receiveToken || !payAmount || isRiskLoading || isSwapping}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold text-lg py-4.5 rounded-2xl mt-5 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] py-4"
            >
              {isSwapping ? (
                 <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" /> {swapStatus}
                 </span>
              ) : !payAmount ? "Введите сумму" : !receiveToken ? "Выберите токен" : "Подтвердить обмен"}
            </button>
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

                  {trading && (
                    <div className="mt-6 border-t border-[#1e293b] pt-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ArrowRightLeft size={14} className="text-blue-500" /> Агрегатор ликвидности
                      </h4>
                      <div className="bg-gradient-to-br from-[#05070a] to-[#0a1120] p-4 rounded-xl border border-[#1e293b]">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-slate-500">Симуляция инвестиции</span>
                          <span className="text-white font-medium">{trading.simulated_investment}</span>
                        </div>
                        
                        {(trading.best_route && trading.best_route.expected_output_human) ? (
                          <>
                            <div className="flex justify-between text-sm mb-3">
                              <span className="text-slate-500">Маршрут (DEX)</span>
                              <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded">
                                {(trading.best_route.route_used && trading.best_route.route_used.join(' → '))}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm pt-3 border-t border-[#1e293b]">
                              <span className="text-slate-400">Ожидаемый выход</span>
                              <span className="text-emerald-400 font-bold text-lg">
                                {formatNumber(trading.best_route.expected_output_human, 4)} {trading.best_route.token_symbol}
                              </span>
                            </div>
                          </>
                        ) : (
                           <div className="font-medium text-sm text-amber-500 text-center py-2">{trading.best_route}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* === МОДАЛЬНОЕ ОКНО === */}
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
    </div>
  );
}

export default App;