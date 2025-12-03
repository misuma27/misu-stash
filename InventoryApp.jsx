import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  Trash2, 
  MapPin, 
  Package, 
  Loader2,
  Sparkles,
  X,
  Download,
  Image as ImageIcon,
  Camera,
  Dog,
  Bone,
  PawPrint,
  Home,
  Edit2,
  Calendar,
  Hash,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  LogOut,
  Box,
  Globe,
  User,
  ArrowRight
} from 'lucide-react';

// --- Firebase Configuration ---
// Note: In your local file, replace this with your actual keys!

const firebaseConfig = {
  apiKey: "AIzaSyDd4MUOfWzSb1DahD9t5WpKMUrXZtpBehM",
  authDomain: "misu-stash.firebaseapp.com",
  projectId: "misu-stash",
  storageBucket: "misu-stash.firebasestorage.app",
  messagingSenderId: "628350838936",
  appId: "1:628350838936:web:f19cba8fe32a726b7708ed",
  measurementId: "G-1S5G74S7C6"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = "misu-tracker";

// --- Translations ---
const translations = {
  en: {
    appTitle: "Misu’s Stash",
    subTitle: "Guarding your stuff, 2.38kg at a time",
    manager: "Manager",
    misu: "Misu",
    statsItems: "Items",
    statsSpots: "Spots",
    statsExport: "Export",
    tabHome: "Home",
    tabStorage: "Storage",
    tabProfile: "Profile",
    gateTitle: "Welcome Home",
    gateSub: "Sign in to manage your inventory.",
    emailLabel: "Email",
    passLabel: "Password",
    loginBtn: "Sign In",
    signupBtn: "Create Account",
    switchLogin: "Have an account? Sign in",
    switchSignup: "No account? Create one",
    guestBtn: "Continue as Guest",
    authErrorDefault: "Something went wrong.",
    btnAdd: "Add Item",
    btnAddSub: "Manual Entry",
    btnSmart: "Smart Add",
    btnSmartSub: "AI Assistant",
    recentTreasures: "Recent Items",
    noItemsYet: "No items yet.",
    modalNew: "New Item",
    modalUpdate: "Edit Item",
    labelWhat: "Name",
    labelHowMany: "Quantity",
    labelExpires: "Expiry",
    labelWhere: "Location",
    labelPhoto: "Add Photo",
    labelPhotoReady: "Photo Added",
    btnSave: "Save Item",
    btnUpdate: "Update",
    placeholderItem: "e.g. Squeaky Toy",
    placeholderLoc: "e.g. Living Room",
    smartTitle: "Ask Misu",
    smartDesc: "Describe what you want to store. Misu will organize it for you.",
    smartPlaceholder: "e.g., \"3 boxes of tissues in the closet...\"",
    smartBtnIdle: "Process",
    smartBtnLoading: "Thinking...",
    headerAllItems: "All Items",
    searchPlaceholder: "Search items...",
    storagePlaces: "Storage",
    nothingFound: "No matches found.",
    misuSays: "Misu's Tip:",
    askMisu: "Get Storage Tip",
    expired: "Expired",
    exp: "Exp",
    deleteConfirm: "Delete this item?",
    logoutConfirm: "Log out of your account?",
    humanProfile: "Profile",
    packStatus: "Status",
    guest: "Guest",
    member: "Member",
    language: "Language",
    signOut: "Sign Out"
  },
  zh: {
    appTitle: "Misu 的寶庫",
    subTitle: "用 2.38kg 的重量守護你的物品",
    manager: "經理",
    misu: "Misu",
    statsItems: "物品",
    statsSpots: "地點",
    statsExport: "匯出",
    tabHome: "首頁",
    tabStorage: "倉庫",
    tabProfile: "設定",
    gateTitle: "歡迎回家",
    gateSub: "登入以管理您的物品。",
    emailLabel: "電子郵件",
    passLabel: "密碼",
    loginBtn: "登入",
    signupBtn: "註冊帳號",
    switchLogin: "已有帳號？登入",
    switchSignup: "沒有帳號？註冊",
    guestBtn: "訪客模式",
    authErrorDefault: "發生錯誤。",
    btnAdd: "新增物品",
    btnAddSub: "手動輸入",
    btnSmart: "智慧新增",
    btnSmartSub: "AI 助手",
    recentTreasures: "最近物品",
    noItemsYet: "尚無物品。",
    modalNew: "新增物品",
    modalUpdate: "編輯物品",
    labelWhat: "名稱",
    labelHowMany: "數量",
    labelExpires: "效期",
    labelWhere: "位置",
    labelPhoto: "新增照片",
    labelPhotoReady: "照片已選",
    btnSave: "儲存",
    btnUpdate: "更新",
    placeholderItem: "例如：發聲玩具",
    placeholderLoc: "例如：客廳",
    smartTitle: "詢問 Misu",
    smartDesc: "描述您要存放的物品，Misu 會為您整理。",
    smartPlaceholder: "例如：「三盒面紙在櫃子裡...」",
    smartBtnIdle: "處理",
    smartBtnLoading: "思考中...",
    headerAllItems: "所有物品",
    searchPlaceholder: "搜尋物品...",
    storagePlaces: "存放位置",
    nothingFound: "找不到相符項目。",
    misuSays: "Misu 的建議：",
    askMisu: "取得保存秘訣",
    expired: "已過期",
    exp: "效期",
    deleteConfirm: "確定要刪除嗎？",
    logoutConfirm: "確定要登出嗎？",
    humanProfile: "個人檔案",
    packStatus: "狀態",
    guest: "訪客",
    member: "會員",
    language: "語言",
    signOut: "登出"
  }
};

// --- Gemini API Helper ---
const callGemini = async (prompt) => {
  const apiKey = "AIzaSyBpZ4jiNfqUy4OuixZjRobBNiGllGUaLrY"; // Provided by runtime environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) throw new Error('Gemini API call failed');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// --- Custom Misu Logo Component ---
const MisuLogo = ({ className }) => (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M25 35 L20 15 L40 25" />
        <path d="M75 35 L80 15 L60 25" />
        <path d="M40 25 Q50 20 60 25" />
        <path d="M25 35 Q5 45 20 70 Q30 80 40 78" />
        <path d="M75 35 Q95 45 80 70 Q70 80 60 78" />
        <circle cx="35" cy="48" r="4" fill="currentColor" stroke="none"/>
        <circle cx="65" cy="48" r="4" fill="currentColor" stroke="none"/>
        <ellipse cx="50" cy="55" rx="5" ry="4" fill="currentColor" stroke="none"/>
        <path d="M50 60 Q50 68 42 64" />
        <path d="M50 60 Q50 68 58 64" />
    </svg>
);

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemExpiry, setNewItemExpiry] = useState('');
  const [newItemImage, setNewItemImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTipId, setActiveTipId] = useState(null);
  const [tipContent, setTipContent] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  
  // New state for custom dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { console.error(e); }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Data Sync Effect ---
  useEffect(() => {
    if (!user) { setItems([]); return; }
    setLoadingItems(true);
    const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'inventory');
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
        const loadedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadedItems.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setItems(loadedItems);
        setLoadingItems(false);
    });
    return () => unsubscribe();
  }, [user]);

  const existingLocations = useMemo(() => {
    const locs = items.map(i => i.location).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      ((item.name || '').toLowerCase().includes(lowerTerm)) || 
      ((item.location || '').toLowerCase().includes(lowerTerm))
    );
  }, [items, searchTerm]);

  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      const loc = item.location || 'Unsorted';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(item);
    });
    return Object.keys(groups).sort().reduce((acc, key) => { acc[key] = groups[key]; return acc; }, {});
  }, [filteredItems]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) { setAuthError(t.authErrorDefault); } 
    finally { setIsAuthenticating(false); }
  };

  const handleGuestLogin = async () => {
    setIsAuthenticating(true);
    try { await signInAnonymously(auth); } catch (error) { setAuthError(t.authErrorDefault); } 
    finally { setIsAuthenticating(false); }
  };

  const handleLogout = async () => {
    if (window.confirm(t.logoutConfirm)) {
      await signOut(auth);
      setActiveTab('home');
      setEmail('');
      setPassword('');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewItemImage(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (item) => {
    setNewItemName(item.name);
    setNewItemLocation(item.location);
    setNewItemQuantity(item.quantity || 1);
    setNewItemExpiry(item.expiryDate || '');
    setNewItemImage(item.image);
    setEditingId(item.id);
    setShowManualAdd(true);
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemLocation('');
    setNewItemQuantity(1);
    setNewItemExpiry('');
    setNewItemImage(null);
    setEditingId(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setShowManualAdd(false);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemLocation.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const itemData = {
        name: newItemName.trim(),
        location: newItemLocation.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        expiryDate: newItemExpiry,
        image: newItemImage,
        updatedAt: serverTimestamp()
      };
      if (editingId) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', editingId), itemData);
      else await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'inventory'), { ...itemData, createdAt: serverTimestamp() });
      resetForm();
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleSmartAdd = async () => {
    if (!smartInput.trim() || !user) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze text and extract items. Text: "${smartInput}". Return valid JSON array. Keys: name(string), location(string), quantity(number), expiryDate(YYYY-MM-DD/null). Keep Traditional Chinese if input is Chinese. Infer location.`;
      const result = await callGemini(prompt);
      const extractedItems = JSON.parse(result.replace(/```json/g, '').replace(/```/g, '').trim());
      if (Array.isArray(extractedItems)) {
        const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'inventory');
        await Promise.all(extractedItems.map(item => addDoc(itemsRef, {
            name: item.name, location: item.location, quantity: item.quantity || 1, expiryDate: item.expiryDate || '', image: null, createdAt: serverTimestamp()
        })));
        setSmartInput('');
        setShowSmartAdd(false);
      }
    } catch (error) { alert(t.authErrorDefault); } 
    finally { setIsAnalyzing(false); }
  };

  const handleGetTip = async (item) => {
    setActiveTipId(item.id);
    setLoadingTip(true);
    try {
      const langInstruction = lang === 'zh' ? 'Traditional Chinese' : 'English';
      const prompt = `Short storage tip for "${item.name}" in ${langInstruction}. Max 15 words. End with 'Woof!' or '汪!'.`;
      const tip = await callGemini(prompt);
      setTipContent(tip);
    } catch (error) { setTipContent("..."); } 
    finally { setLoadingTip(false); }
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(t.deleteConfirm)) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', id)); } catch (e) { console.error(e); }
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const csvRows = items.map(item => [
      `"${(item.name || '').replace(/"/g, '""')}"`, `"${(item.location || '').replace(/"/g, '""')}"`, item.quantity || 1, item.expiryDate || ''
    ].join(','));
    const blob = new Blob(["\uFEFF" + ['Name,Location,Qty,Expiry', ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `misu_inventory.csv`;
    link.click();
  };

  const isExpired = (d) => d && new Date(d) < new Date(new Date().setHours(0,0,0,0));

  if (authLoading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-400" /></div>;

  if (!user) {
    return (
        <div className="min-h-screen bg-stone-50 font-sans flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-3xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center mb-6 text-orange-500 transform rotate-3 hover:rotate-0 transition-all duration-500">
                        <MisuLogo className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-bold text-orange-600 tracking-tight mb-2">{t.gateTitle}</h1>
                    <p className="text-stone-500">{t.gateSub}</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider ml-1">{t.emailLabel}</label>
                            <input 
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-stone-50/50 border border-stone-100 rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all text-stone-800 placeholder:text-stone-300"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider ml-1">{t.passLabel}</label>
                            <input 
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-stone-50/50 border border-stone-100 rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all text-stone-800 placeholder:text-stone-300"
                            />
                        </div>
                        {authError && <div className="text-red-500 text-sm flex items-center gap-2 px-1"><AlertCircle className="w-4 h-4" />{authError}</div>}
                        <button type="submit" disabled={isAuthenticating} className="w-full bg-stone-900 text-white font-semibold py-4 rounded-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-70">
                            {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (authMode === 'login' ? t.loginBtn : t.signupBtn)}
                        </button>
                    </form>
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <button onClick={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')} className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
                            {authMode === 'login' ? t.switchSignup : t.switchLogin}
                        </button>
                        <button onClick={handleGuestLogin} className="text-xs font-medium text-orange-400 hover:text-orange-600 tracking-wide uppercase">
                            {t.guestBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- Components ---
  const TabButton = ({ id, icon: Icon, label }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300 ${activeTab === id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
      >
          <Icon className={`w-6 h-6 ${activeTab === id ? 'fill-current' : 'stroke-[2px]'}`} strokeWidth={activeTab === id ? 0 : 2} />
          <span className="text-[10px] font-semibold tracking-wide">{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-28 selection:bg-orange-100 selection:text-orange-900">
      
      {/* Header Area */}
      {activeTab === 'home' && (
         <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-stone-100/50 transition-all">
             <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
                 <div>
                     <h1 className="text-2xl font-bold text-orange-600">{t.appTitle}</h1>
                     <p className="text-sm font-medium text-stone-500">{t.subTitle}</p>
                 </div>
                 <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-stone-100 flex items-center justify-center text-stone-900">
                     <MisuLogo className="w-6 h-6" />
                 </div>
             </div>
         </header>
      )}

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-6 pt-6 space-y-8">
        
        {activeTab === 'profile' && (
            <div className="flex flex-col items-center pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center mb-6 text-stone-900">
                    <MisuLogo className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-1">{t.humanProfile}</h2>
                <p className="text-stone-500 mb-8 font-medium">{user.isAnonymous ? t.guest : user.email}</p>
                
                <div className="w-full bg-white rounded-3xl p-2 shadow-sm border border-stone-100">
                    <div className="flex justify-between items-center p-4 border-b border-stone-50">
                        <span className="text-sm font-medium text-stone-500">{t.packStatus}</span>
                        <span className="text-xs font-bold bg-stone-100 text-stone-600 px-3 py-1 rounded-full uppercase tracking-wide">{user.isAnonymous ? t.guest : t.member}</span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                        <div className="flex items-center gap-2 text-stone-500 text-sm font-medium"><Globe className="w-4 h-4" />{t.language}</div>
                        <div className="flex bg-stone-100 p-1 rounded-xl">
                            <button onClick={() => setLang('en')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${lang === 'en' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>EN</button>
                            <button onClick={() => setLang('zh')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${lang === 'zh' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>中文</button>
                        </div>
                    </div>
                </div>
                
                <button onClick={handleLogout} className="mt-8 text-red-400 hover:text-red-500 font-semibold text-sm flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> {t.signOut}
                </button>
            </div>
        )}

        {activeTab === 'storage' && (
            <div className="animate-in fade-in duration-500 space-y-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-stone-800 placeholder:text-stone-300 outline-none shadow-sm border border-stone-100 focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10 transition-all"
                    />
                </div>

                <div className="space-y-6 pb-20">
                    {loadingItems ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-200"/></div> : 
                    filteredItems.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <Box className="w-12 h-12 mx-auto mb-3 text-stone-300" strokeWidth={1} />
                            <p>{t.nothingFound}</p>
                        </div>
                    ) : (
                        Object.entries(groupedItems).map(([location, items]) => (
                            <div key={location}>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 ml-1">{location}</h3>
                                <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-stone-100 overflow-hidden">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className={`group ${idx !== items.length -1 ? 'border-b border-stone-50' : ''}`}>
                                            <div onClick={() => setExpandedItems(p => ({...p, [item.id]: !p[item.id]}))} className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors">
                                                 <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-sm font-bold text-stone-400">
                                                     {item.quantity}×
                                                 </div>
                                                 <div className="flex-1">
                                                     <h4 className="font-semibold text-stone-800">{item.name}</h4>
                                                     {item.expiryDate && (
                                                         <span className={`text-[10px] font-bold uppercase tracking-wide ${isExpired(item.expiryDate) ? 'text-red-500' : 'text-stone-400'}`}>
                                                             {isExpired(item.expiryDate) ? t.expired : t.exp} {item.expiryDate}
                                                         </span>
                                                     )}
                                                 </div>
                                                 <ChevronRight className={`w-5 h-5 text-stone-300 transition-transform ${expandedItems[item.id] ? 'rotate-90' : ''}`} />
                                            </div>
                                            
                                            {expandedItems[item.id] && (
                                                <div className="px-4 pb-4 pt-0 bg-stone-50/30 animate-in slide-in-from-top-2">
                                                    <div className="flex gap-3">
                                                        <div className="w-20 h-20 bg-white rounded-2xl border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <Camera className="w-6 h-6 text-stone-200"/>}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <button onClick={() => handleGetTip(item)} className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-xs font-medium text-stone-500 flex items-center justify-center gap-2 hover:border-orange-200 hover:text-orange-500 transition-colors">
                                                                <Sparkles className="w-3 h-3"/> {activeTipId === item.id ? (loadingTip ? "..." : tipContent) : t.askMisu}
                                                            </button>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => openEditModal(item)} className="flex-1 bg-blue-50 text-blue-500 rounded-xl py-2 flex items-center justify-center"><Edit2 className="w-3 h-3"/></button>
                                                                <button onClick={(e) => handleDeleteItem(item.id, e)} className="flex-1 bg-red-50 text-red-500 rounded-xl py-2 flex items-center justify-center"><Trash2 className="w-3 h-3"/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {activeTab === 'home' && (
            <div className="animate-in fade-in duration-500">
                {/* Stats Widget - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-100 flex flex-col items-center justify-center gap-1 text-center">
                         <span className="text-2xl font-bold text-stone-900">{items.length}</span>
                         <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">{t.statsItems}</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-stone-100 flex flex-col items-center justify-center gap-1 text-center">
                         <span className="text-2xl font-bold text-stone-900">{existingLocations.length}</span>
                         <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">{t.statsSpots}</span>
                    </div>
                     <button onClick={handleExportCSV} className="bg-stone-900 p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 text-white hover:bg-black transition-colors">
                         <Download className="w-5 h-5" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">{t.statsExport}</span>
                    </button>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <button onClick={() => { resetForm(); setShowManualAdd(true); }} className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 text-left hover:scale-[1.02] active:scale-95 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-stone-900">{t.btnAdd}</h3>
                        <p className="text-xs text-stone-400 mt-1">{t.btnAddSub}</p>
                    </button>
                    <button onClick={() => { setShowSmartAdd(true); resetForm(); }} className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 text-left hover:scale-[1.02] active:scale-95 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-stone-900">{t.btnSmart}</h3>
                        <p className="text-xs text-stone-400 mt-1">{t.btnSmartSub}</p>
                    </button>
                </div>

                {/* Recent Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-stone-900">{t.recentTreasures}</h2>
                        <button onClick={() => setActiveTab('storage')} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"><ArrowRight className="w-4 h-4"/></button>
                    </div>
                    {items.slice(0,3).map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-2xl flex items-center gap-4 shadow-sm border border-stone-100/50">
                            <div className="w-14 h-14 bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <Package className="w-6 h-6 text-stone-200"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-stone-900 truncate">{item.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{item.quantity}</span>
                                    <span className="truncate flex items-center gap-1"><MapPin className="w-3 h-3"/>{item.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Modals */}
        {(showManualAdd || showSmartAdd) && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={() => {setShowManualAdd(false); setShowSmartAdd(false);}}></div>
                <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-stone-900">{showSmartAdd ? t.smartTitle : (editingId ? t.modalUpdate : t.modalNew)}</h3>
                        <button onClick={() => {setShowManualAdd(false); setShowSmartAdd(false);}} className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:bg-stone-100"><X className="w-5 h-5"/></button>
                    </div>

                    {showSmartAdd ? (
                        <div className="space-y-4">
                            <p className="text-stone-500 text-sm leading-relaxed">{t.smartDesc}</p>
                            <textarea
                                value={smartInput} onChange={(e) => setSmartInput(e.target.value)}
                                className="w-full h-32 bg-stone-50 rounded-2xl p-4 text-stone-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                placeholder={t.smartPlaceholder} disabled={isAnalyzing}
                            />
                            <button onClick={handleSmartAdd} disabled={!smartInput.trim() || isAnalyzing} className="w-full py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>} {isAnalyzing ? t.smartBtnLoading : t.smartBtnIdle}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">{t.labelWhat}</label>
                                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full bg-stone-50 rounded-2xl py-3 px-4 text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all" placeholder={t.placeholderItem} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">{t.labelHowMany}</label>
                                    <input type="number" min="1" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} className="w-full bg-stone-50 rounded-2xl py-3 px-4 text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">{t.labelExpires}</label>
                                    <input type="date" value={newItemExpiry} onChange={(e) => setNewItemExpiry(e.target.value)} className="w-full bg-stone-50 rounded-2xl py-3 px-4 text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all text-sm" />
                                </div>
                                <div className="col-span-2 space-y-1 relative">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">{t.labelWhere}</label>
                                    <input 
                                        type="text" 
                                        value={newItemLocation} 
                                        onChange={(e) => setNewItemLocation(e.target.value)} 
                                        onFocus={() => setShowLocationDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                                        className="w-full bg-stone-50 rounded-2xl py-3 px-4 text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all" 
                                        placeholder={t.placeholderLoc} 
                                        required 
                                        autoComplete="off"
                                    />
                                    {showLocationDropdown && existingLocations.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-xl border border-stone-100 max-h-48 overflow-y-auto">
                                            {existingLocations.filter(l => l.toLowerCase().includes(newItemLocation.toLowerCase())).map(l => (
                                                <button
                                                    key={l}
                                                    type="button"
                                                    onClick={() => { setNewItemLocation(l); setShowLocationDropdown(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-stone-50 last:border-0"
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="file" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} className="hidden" id="pic" />
                                <label htmlFor="pic" className={`flex-1 py-3 rounded-2xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all ${newItemImage ? 'border-green-300 bg-green-50 text-green-600' : 'border-stone-200 text-stone-400 hover:bg-stone-50'}`}>
                                    <Camera className="w-4 h-4"/> <span className="text-xs font-bold">{newItemImage ? t.labelPhotoReady : t.labelPhoto}</span>
                                </label>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-black disabled:opacity-50 transition-all">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : (editingId ? t.btnUpdate : t.btnSave)}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        )}

      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl p-2 flex items-center gap-1 z-50 scale-100 origin-bottom animate-in slide-in-from-bottom-4">
          <TabButton id="home" icon={Home} label={t.tabHome} />
          <TabButton id="storage" icon={Box} label={t.tabStorage} />
          <TabButton id="profile" icon={User} label={t.tabProfile} />
      </nav>

    </div>
  );
}