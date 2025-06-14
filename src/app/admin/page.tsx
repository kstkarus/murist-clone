'use client';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiPower, FiSettings, FiMessageSquare, FiStar, FiUsers, FiTrash2, FiUpload, FiImage } from 'react-icons/fi';

interface User {
  username: string;
  role: 'admin' | 'user';
  notify: boolean;
  email?: string;
}

interface SiteSettings {
  siteName: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  description: string;
  vkLink: string;
  telegramLink: string;
  guaranteeText: string;
}

type Tab = 'requests' | 'users' | 'settings' | 'services' | 'advantages' | 'team' | 'reviews' | 'content';

interface Review {
  id: number;
  author: string;
  text: string;
  rating: number;
  photo: string;
  order: number;
  createdAt: string;
}

interface Request {
  id: number;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sort, setSort] = useState<{field: string, dir: 'asc'|'desc'}>({field: 'createdAt', dir: 'desc'});
  const [newUser, setNewUser] = useState({username: '', password: '', role: 'user', notify: false, email: ''});
  const [userError, setUserError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editEmail, setEditEmail] = useState<{[id:number]: string}>({});
  const [resetPassword, setResetPassword] = useState<{[id:number]: string}>({});
  const [showReset, setShowReset] = useState<{[id:number]: boolean}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    phone: '',
    email: '',
    address: '',
    workingHours: '',
    description: '',
    vkLink: '',
    telegramLink: '',
    guaranteeText: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [advantages, setAdvantages] = useState<any[]>([]);
  const [newService, setNewService] = useState({ title: '', description: '', icon: '' });
  const [newAdvantage, setNewAdvantage] = useState({ value: '', label: '', icon: '' });
  const [team, setTeam] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ name: '', position: '', photo: '', bio: '' });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ author: '', text: '', rating: 5, photo: '', order: 0 });
  const [processedRequests, setProcessedRequests] = useState<Set<number>>(new Set());
  const [uploadingFile, setUploadingFile] = useState<{ [key: string]: boolean }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchRequests();
      if ((session.user as any).role === 'admin') {
        fetchUsers();
        fetchReviews();
      }
      fetchServices();
      fetchAdvantages();
      fetchTeam();
    }
  }, [status, session, sort]);

  useEffect(() => {
    // Создаем элемент аудио для уведомлений
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5; // Устанавливаем громкость на 50%
    
    // Функция для проверки новых заявок
    const checkNewRequests = async () => {
      if (!session?.user) return logout();
      
      const res = await fetch('/api/request');
      if (res.status === 401) return logout();
      const data = await res.json();
      const currentRequests = data.requests || [];
      
      // Проверяем новые заявки
      const newRequests = currentRequests.filter((req: Request) => !processedRequests.has(req.id));
      
      if (newRequests.length > 0) {
        setRequests(currentRequests);
        // Добавляем новые заявки в обработанные
        setProcessedRequests(prev => new Set([...prev, ...newRequests.map((req: Request) => req.id)]));
        
        // Воспроизводим звук уведомления
        try {
          if (audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log('Автовоспроизведение заблокировано:', error);
              });
            }
          }
        } catch (error) {
          console.error('Ошибка воспроизведения звука:', error);
        }
      }
      
      setLastRequestCount(currentRequests.length);
    };

    // Устанавливаем интервал проверки каждые 30 секунд
    const intervalId = setInterval(checkNewRequests, 30000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [session, processedRequests]);

  useEffect(() => {
    // Загружаем настройки сайта при монтировании
    fetchSettings();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false
    });

    if (result?.error) {
      setError(result.error);
    }
  }

  async function fetchRequests() {
    try {
      const res = await fetch('/api/request');
      if (res.status === 401) return logout();
      const data = await res.json();
      const currentRequests = data.requests || [];
      
      // Проверяем новые заявки
      const newRequests = currentRequests.filter((req: Request) => !processedRequests.has(req.id));
      
      if (newRequests.length > 0) {
        setRequests(currentRequests);
        // Добавляем новые заявки в обработанные
        setProcessedRequests(prev => new Set([...prev, ...newRequests.map((req: Request) => req.id)]));
        
        // Воспроизводим звук уведомления
        try {
          if (audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log('Автовоспроизведение заблокировано:', error);
              });
            }
          }
        } catch (error) {
          console.error('Ошибка воспроизведения звука:', error);
        }
      }
    } catch (error) {
      console.error('Ошибка получения заявок:', error);
    }
  }

  async function fetchUsers() {
    const res = await fetch('/api/user');
    if (res.status === 401) return logout();
    const data = await res.json();
    setUsers(data.users || []);
  }

  function handleSort(field: string) {
    setSort(s => ({
      field,
      dir: s.field === field ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError('');
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    if (res.ok) {
      setNewUser({username: '', password: '', role: 'user', notify: false, email: ''});
      fetchUsers();
    } else {
      setUserError(data.error || 'Ошибка создания пользователя');
    }
  }

  async function logout() {
    await signOut({ redirect: false });
    router.push('/');
  }

  async function handleDeleteRequest(id: number) {
    try {
      const res = await fetch('/api/request', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Ошибка удаления заявки:', error);
    }
  }

  async function handleDeleteUser(id: number) {
    if (!window.confirm('Удалить пользователя?')) return;
    const res = await fetch('/api/user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.status === 401) return logout();
    fetchUsers();
  }

  async function handleUpdateNotify(id: number, notify: boolean) {
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notify })
    });
    fetchUsers();
  }

  async function handleUpdateEmail(id: number, email: string) {
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email })
    });
    fetchUsers();
  }

  async function handleResetPassword(id: number) {
    const password = resetPassword[id];
    if (!password) return;
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    });
    setShowReset(prev => ({...prev, [id]: false}));
    setResetPassword(prev => ({...prev, [id]: ''}));
  }

  const exportToExcel = () => {
    const filteredRequests = requests.filter(r => {
      const q = search.toLowerCase();
      return (
        (!q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)) &&
        (!dateFrom || new Date(r.createdAt) >= new Date(dateFrom)) &&
        (!dateTo || new Date(r.createdAt) <= new Date(dateTo + 'T23:59:59'))
      );
    });

    const data = filteredRequests.map(r => ({
      'ФИО': r.name,
      'Телефон': r.phone,
      'Дата': new Date(r.createdAt).toLocaleString('ru-RU')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Заявки');
    XLSX.writeFile(wb, 'заявки.xlsx');
  };

  const exportToCSV = () => {
    const filteredRequests = requests.filter(r => {
      const q = search.toLowerCase();
      return (
        (!q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)) &&
        (!dateFrom || new Date(r.createdAt) >= new Date(dateFrom)) &&
        (!dateTo || new Date(r.createdAt) <= new Date(dateTo + 'T23:59:59'))
      );
    });

    const data = filteredRequests.map(r => ({
      'ФИО': r.name,
      'Телефон': r.phone,
      'Дата': new Date(r.createdAt).toLocaleString('ru-RU')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'заявки.csv';
    link.click();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchRequests(), fetchReviews()]);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings({
        siteName: data.siteName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        workingHours: data.workingHours || '',
        description: data.description || '',
        vkLink: data.vkLink || '',
        telegramLink: data.telegramLink || '',
        guaranteeText: data.guaranteeText || ''
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ошибка сохранения настроек');
      }
      
      const savedSettings = await res.json();
      setSettings(savedSettings);
      alert('Настройки успешно сохранены');
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      alert(error instanceof Error ? error.message : 'Ошибка сохранения настроек');
    } finally {
      setIsSavingSettings(false);
    }
  };

  async function fetchServices() {
    const res = await fetch('/api/service');
    const data = await res.json();
    setServices(data.services || []);
  }

  async function fetchAdvantages() {
    const res = await fetch('/api/advantage');
    const data = await res.json();
    setAdvantages(data.advantages || []);
  }

  async function fetchTeam() {
    const res = await fetch('/api/team');
    const data = await res.json();
    setTeam(data.team || []);
  }

  async function fetchReviews() {
    try {
      const res = await fetch('/api/review');
      if (res.status === 401) return logout();
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Ошибка получения отзывов:', error);
    }
  }

  const handleAddReview = async () => {
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        setNewReview({ author: '', text: '', rating: 5, photo: '', order: 0 });
        fetchReviews();
      }
    } catch (error) {
      console.error('Ошибка добавления отзыва:', error);
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      const res = await fetch('/api/review', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Ошибка удаления отзыва:', error);
    }
  };

  const handleDeleteService = async (id: number) => {
    try {
      const res = await fetch('/api/service', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
    }
  };

  const handleDeleteAdvantage = async (id: number) => {
    try {
      const res = await fetch('/api/advantage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchAdvantages();
      }
    } catch (error) {
      console.error('Ошибка удаления преимущества:', error);
    }
  };

  const handleDeleteTeamMember = async (id: number) => {
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchTeam();
      }
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      if (res.ok) {
        setNewService({ title: '', description: '', icon: '' });
        fetchServices();
      }
    } catch (error) {
      console.error('Ошибка добавления услуги:', error);
    }
  };

  const handleAddAdvantage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/advantage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdvantage)
      });
      if (res.ok) {
        setNewAdvantage({ value: '', label: '', icon: '' });
        fetchAdvantages();
      }
    } catch (error) {
      console.error('Ошибка добавления преимущества:', error);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      if (res.ok) {
        setNewMember({ name: '', position: '', photo: '', bio: '' });
        fetchTeam();
      }
    } catch (error) {
      console.error('Ошибка добавления сотрудника:', error);
    }
  };

  // Функция для загрузки файла
  const handleFileUpload = async (file: File, type: string, id?: number) => {
    try {
      setUploadingFile(prev => ({ ...prev, [type]: true }));
      const formData = new FormData();
      formData.append('file', file);
      if (id) {
        formData.append('id', id.toString());
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Ошибка загрузки файла');

      const data = await res.json();
      
      // Обновляем соответствующее состояние в зависимости от типа
      switch (type) {
        case 'team':
          setNewMember(prev => ({ ...prev, photo: data.url }));
          break;
        case 'review':
          setNewReview(prev => ({ ...prev, photo: data.url }));
          break;
        default:
          break;
      }

      return data.url;
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert('Ошибка при загрузке файла');
      return null;
    } finally {
      setUploadingFile(prev => ({ ...prev, [type]: false }));
    }
  };

  // Компонент загрузки файла
  const FileUpload = ({ type, id, currentUrl, onUpload }: { type: string; id?: number; currentUrl?: string; onUpload: (url: string) => void }) => {
    const handleClick = () => {
      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]?.click();
      }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = await handleFileUpload(file, type, id);
        if (url) onUpload(url);
      }
      // Очищаем input после загрузки
      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]!.value = '';
      }
    };

    return (
      <div className="relative">
        <input
          type="file"
          ref={(el: HTMLInputElement | null) => {
            fileInputRefs.current[type] = el;
          }}
          onChange={handleChange}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={uploadingFile[type]}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            uploadingFile[type]
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <FiUpload className="w-4 h-4" />
          <span>{uploadingFile[type] ? 'Загрузка...' : 'Загрузить фото'}</span>
        </button>
        {currentUrl && (
          <div className="mt-2">
            <img
              src={currentUrl}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Панель управления</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg transition-colors ${
                  isRefreshing 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                disabled={isRefreshing}
              >
                <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <FiPower className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Вкладки */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('requests')}
                className={`${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Заявки
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Пользователи
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Контент
              </button>
            </nav>
          </div>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'requests' && (
          <div className="w-full">
            {/* Заявки */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiMessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                    Заявки
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {requests.length}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {/* Фильтры и сортировка */}
                <div className="mb-4 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Поиск по имени или телефону"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div className="flex gap-4">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          sort.field === 'createdAt'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        По дате {sort.field === 'createdAt' && (sort.dir === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('name')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          sort.field === 'name'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        По имени {sort.field === 'name' && (sort.dir === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={exportToExcel}
                        className="px-3 py-1 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        Excel
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="px-3 py-1 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests
                    .filter(r => {
                      const q = search.toLowerCase();
                      return (
                        (!q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)) &&
                        (!dateFrom || new Date(r.createdAt) >= new Date(dateFrom)) &&
                        (!dateTo || new Date(r.createdAt) <= new Date(dateTo + 'T23:59:59'))
                      );
                    })
                    .sort((a, b) => {
                      if (sort.field === 'createdAt') {
                        return sort.dir === 'asc'
                          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      }
                      if (sort.field === 'name') {
                        return sort.dir === 'asc'
                          ? a.name.localeCompare(b.name)
                          : b.name.localeCompare(a.name);
                      }
                      return 0;
                    })
                    .map((request, index) => (
                      <div
                        key={request.id}
                        className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 relative"
                      >
                        <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{request.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{request.phone}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRequest(request.id);
                              }}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Управление пользователями</h2>
            
            {/* Форма создания пользователя */}
            <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3 text-gray-900">Создать нового пользователя</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newUser.notify}
                    onChange={(e) => setNewUser({ ...newUser, notify: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Уведомления</label>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать пользователя
              </button>
            </form>

            {/* Список пользователей */}
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">Роль: {user.role}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={user.notify}
                          onChange={(e) => handleUpdateNotify(user.id, e.target.checked)}
                          className="mr-2"
                        />
                        <label className="text-gray-700">Уведомления</label>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Основные настройки сайта */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Основные настройки</h2>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название сайта</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Режим работы</label>
                  <input
                    type="text"
                    value={settings.workingHours}
                    onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание сайта</label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка ВКонтакте</label>
                  <input
                    type="text"
                    value={settings.vkLink}
                    onChange={(e) => setSettings({ ...settings, vkLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка Telegram</label>
                  <input
                    type="text"
                    value={settings.telegramLink}
                    onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Текст гарантии</label>
                  <textarea
                    value={settings.guaranteeText}
                    onChange={(e) => setSettings({ ...settings, guaranteeText: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Сохранение...' : 'Сохранить настройки'}
                </button>
              </form>
            </div>

            {/* Управление услугами */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Услуги</h2>
              <form onSubmit={handleAddService} className="mb-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Название услуги"
                    value={newService.title}
                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <textarea
                    placeholder="Описание"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Иконка (название)"
                    value={newService.icon}
                    onChange={(e) => setNewService({ ...newService, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Добавить услугу
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{service.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Иконка: {service.icon}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Управление преимуществами */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Преимущества</h2>
              <form onSubmit={handleAddAdvantage} className="mb-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Заголовок"
                    value={newAdvantage.label}
                    onChange={(e) => setNewAdvantage({ ...newAdvantage, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <textarea
                    placeholder="Описание"
                    value={newAdvantage.value}
                    onChange={(e) => setNewAdvantage({ ...newAdvantage, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Иконка (название)"
                    value={newAdvantage.icon}
                    onChange={(e) => setNewAdvantage({ ...newAdvantage, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Добавить преимущество
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {advantages.map((advantage) => (
                  <div key={advantage.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{advantage.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{advantage.value}</p>
                        <p className="text-xs text-gray-500 mt-1">Иконка: {advantage.icon}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAdvantage(advantage.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Управление персоналом */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Персонал</h2>
              <form onSubmit={handleAddTeamMember} className="mb-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Имя"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Должность"
                    value={newMember.position}
                    onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
                    <FileUpload
                      type="team"
                      currentUrl={newMember.photo}
                      onUpload={(url) => setNewMember(prev => ({ ...prev, photo: url }))}
                    />
                  </div>
                  <textarea
                    placeholder="Биография"
                    value={newMember.bio}
                    onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Добавить сотрудника
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {team.map((member) => (
                  <div key={member.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        {member.photo && (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.position}</p>
                          <p className="text-sm text-gray-700 mt-2">{member.bio}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Управление отзывами */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Отзывы</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleAddReview(); }} className="mb-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Имя автора"
                    value={newReview.author}
                    onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                  <textarea
                    placeholder="Текст отзыва"
                    value={newReview.text}
                    onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
                    <FileUpload
                      type="review"
                      currentUrl={newReview.photo}
                      onUpload={(url) => setNewReview(prev => ({ ...prev, photo: url }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Рейтинг:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewReview(prev => ({ ...prev, rating }));
                          }}
                          className="p-1"
                        >
                          <FiStar
                            className={`w-5 h-5 ${
                              rating <= newReview.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Добавить отзыв
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{review.author}</h3>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{review.text}</p>
                    {review.photo && (
                      <img
                        src={review.photo}
                        alt="Фото к отзыву"
                        className="mt-2 rounded-lg w-full h-32 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 