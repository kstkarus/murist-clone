'use client';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiPower, FiSettings, FiMessageSquare, FiStar, FiUsers, FiTrash2, FiUpload, FiImage } from 'react-icons/fi';
import Cookies from 'js-cookie';
import * as FiIcons from 'react-icons/fi';
import { Fragment } from 'react';
import dynamic from 'next/dynamic';
import 'quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any;

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  notify: boolean;
  email?: string;
}

interface SiteSettings {
  siteName: string;
  footerCompanyName: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  description: string;
  vkLink: string;
  telegramLink: string;
  guaranteeText: string;
  privacyPolicy: string;
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

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  order?: number;
}

interface Advantage {
  id: number;
  value: string;
  label: string;
  icon: string;
  order?: number;
}

interface TeamMember {
  id: number;
  name: string;
  position: string;
  photo: string;
  bio: string;
  order?: number;
}

export default function AdminPanel() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
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
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    footerCompanyName: '',
    phone: '',
    email: '',
    address: '',
    workingHours: '',
    description: '',
    vkLink: '',
    telegramLink: '',
    guaranteeText: '',
    privacyPolicy: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [advantages, setAdvantages] = useState<Advantage[]>([]);
  const [newService, setNewService] = useState({ title: '', description: '', icon: '' });
  const [newAdvantage, setNewAdvantage] = useState({ value: '', label: '', icon: '' });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: '', position: '', photo: '', bio: '' });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ author: '', text: '', rating: 5, photo: '', order: 0 });
  const [processedRequests, setProcessedRequests] = useState<Set<number>>(new Set());
  const [newRequestIds, setNewRequestIds] = useState<Set<number>>(new Set());
  const [uploadingFile, setUploadingFile] = useState<{ [key: string]: boolean }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok && data.authorized) {
        setIsAuth(true);
        setUserRole(data.user?.role || null);
        setCurrentUserId(data.user?.id || null);
        setCurrentUsername(data.user?.username || null);
      } else {
        setIsAuth(false);
        setUserRole(null);
        setCurrentUserId(null);
        setCurrentUsername(null);
        // Очищаем куки на клиенте
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch {
      setIsAuth(false);
      setUserRole(null);
      setCurrentUserId(null);
      setCurrentUsername(null);
      // Очищаем куки на клиенте
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchRequests();
      
      if (userRole === 'admin') {
        fetchUsers();
        fetchServices();
        fetchAdvantages();
        fetchTeam();
        fetchReviews();
      }
    }
  }, [isAuth, userRole, sort]);

  useEffect(() => {
    // Создаем элемент аудио для уведомлений
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
    
    // Функция для проверки новых заявок
    const checkNewRequests = async () => {
      if (!isAuth) return logout();
      const res = await fetch('/api/request', { credentials: 'include' });
      if (res.status === 401) return logout();
      const data = await res.json();
      const currentRequests = data.requests || [];
      
      // Проверяем только заявки, созданные после последней проверки
      const newRequests = currentRequests.filter((req: Request) => 
        new Date(req.createdAt) > lastCheckTime && !processedRequests.has(req.id)
      );
      
      if (newRequests.length > 0) {
        setRequests(currentRequests);
        setProcessedRequests(prev => new Set([...prev, ...newRequests.map((req: Request) => req.id)]));
        // Добавляем новые заявки для анимации
        setNewRequestIds(new Set(newRequests.map((req: Request) => req.id)));
        
        // Воспроизводим звук только если есть новые заявки
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

        // Удаляем анимацию через 5 секунд
        setTimeout(() => {
          setNewRequestIds(new Set());
        }, 5000);
      }
      
      setLastCheckTime(new Date());
      setLastRequestCount(currentRequests.length);
    };

    // Устанавливаем интервал проверки каждые 30 секунд
    const intervalId = setInterval(checkNewRequests, 30000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [isAuth, processedRequests, lastCheckTime]);

  useEffect(() => {
    // Загружаем настройки сайта при монтировании
    fetchSettings();
  }, []);

  // Получение CSRF-токена из cookie
  function getCsrfTokenFromCookie() {
    return Cookies.get('csrfToken') || '';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const result = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    if (result.ok) {
      const data = await result.json();
      setCsrfToken(data.csrfToken);
      await checkAuth();
    } else {
      setError(result.statusText || 'Ошибка входа');
    }
  }

  async function fetchRequests() {
    try {
      const res = await fetch('/api/request', { credentials: 'include' });
      if (res.status === 401) return logout();
      const data = await res.json();
      const currentRequests = data.requests || [];
      
      // Всегда обновляем список заявок
      setRequests(currentRequests);
      
      // Проверяем только заявки, созданные после последней проверки
      const newRequests = currentRequests.filter((req: Request) => 
        new Date(req.createdAt) > lastCheckTime && !processedRequests.has(req.id)
      );
      
      if (newRequests.length > 0) {
        // Добавляем новые заявки в обработанные
        setProcessedRequests(prev => new Set([...prev, ...newRequests.map((req: Request) => req.id)]));
        // Добавляем новые заявки для анимации
        setNewRequestIds(new Set(newRequests.map((req: Request) => req.id)));
        
        // Воспроизводим звук только если есть новые заявки
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

        // Удаляем анимацию через 5 секунд
        setTimeout(() => {
          setNewRequestIds(new Set());
        }, 5000);
      }
      
      setLastCheckTime(new Date());
      setLastRequestCount(currentRequests.length);
    } catch (error) {
      console.error('Ошибка получения заявок:', error);
    }
  }

  async function fetchUsers() {
    const res = await fetch('/api/user', { credentials: 'include' });
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
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken || getCsrfTokenFromCookie()
      },
      credentials: 'include',
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
    await fetch('/api/login', { method: 'DELETE', credentials: 'include' });
    setIsAuth(false);
    setUserRole(null);
  }

  async function handleDeleteRequest(id: number) {
    try {
      const res = await fetch('/api/request', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || getCsrfTokenFromCookie()
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setRequests(prevRequests => prevRequests.filter(request => request.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления заявки:', error);
    }
  }

  async function handleDeleteUser(id: string) {
    // Проверяем, не пытается ли админ удалить свой аккаунт
    if (id === currentUserId) {
      alert('Вы не можете удалить свой собственный аккаунт');
      return;
    }
    
    if (!window.confirm('Удалить пользователя?')) return;
    const res = await fetch('/api/user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.status === 401) return logout();
    fetchUsers();
  }

  async function handleUpdateNotify(id: string, notify: boolean) {
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
    const res = await fetch('/api/settings', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setSettings({
        siteName: data.siteName || '',
        footerCompanyName: data.footerCompanyName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        workingHours: data.workingHours || '',
        description: data.description || '',
        vkLink: data.vkLink || '',
        telegramLink: data.telegramLink || '',
        guaranteeText: data.guaranteeText || '',
        privacyPolicy: data.privacyPolicy || ''
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
    const res = await fetch('/api/service', { credentials: 'include' });
    const data = await res.json();
    setServices(data.services || []);
  }

  async function fetchAdvantages() {
    const res = await fetch('/api/advantage', { credentials: 'include' });
    const data = await res.json();
    setAdvantages(data.advantages || []);
  }

  async function fetchTeam() {
    const res = await fetch('/api/team', { credentials: 'include' });
    const data = await res.json();
    setTeam(data.team || []);
  }

  async function fetchReviews() {
    try {
      const res = await fetch('/api/review', { credentials: 'include' });
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

  // IconPicker компонент
  function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
    const [open, setOpen] = useState(false);
    const iconNames = Object.keys(FiIcons).filter((name) => name.startsWith('Fi'));
    const SelectedIcon = value && FiIcons[value as keyof typeof FiIcons];
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors mb-2`}
        >
          {SelectedIcon ? (
            <span className="text-xl"><SelectedIcon /></span>
          ) : (
            <span className="text-xl"><FiIcons.FiImage /></span>
          )}
          <span>{value ? 'Изменить иконку' : 'Выбрать иконку'}</span>
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-gray-100 rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold mb-0 pl-2 text-blue-700">Выберите иконку</h3>
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700 text-3xl">×</button>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-5">
                  {iconNames.map((name) => {
                    const Icon = FiIcons[name as keyof typeof FiIcons];
                    const isSelected = value === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        className={`flex flex-col items-center justify-center p-2 rounded border transition-all
                          ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-transparent'}
                          hover:bg-blue-600 group`}
                        style={{ minWidth: 70, minHeight: 70 }}
                        onClick={() => {
                          onChange(name);
                          setOpen(false);
                        }}
                      >
                        {Icon ? (
                          <Icon
                            className={`text-2xl mb-2 transition-colors
                              ${isSelected ? 'text-blue-600' : 'text-gray-700'}
                              group-hover:text-white`
                            }
                          />
                        ) : null}
                        <span className={`text-xs font-semibold text-center break-words leading-tight mt-1 px-1 ${isSelected ? 'text-blue-700' : 'text-gray-800'} group-hover:text-white`}
                          style={{wordBreak: 'break-all', maxWidth: 60, maxHeight: 32, overflow: 'hidden', display: 'block'}}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              <input
                id="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
              {currentUsername && (
                <span className="text-sm text-gray-600">
                  {currentUsername}
                </span>
              )}
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
              {userRole === 'admin' && (
                <>
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
                </>
              )}
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
                        className={`p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 relative ${
                          newRequestIds.has(request.id) ? 'animate-glow' : ''
                        }`}
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
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
              {userError && <div className="mt-2 text-red-600 text-sm">{userError}</div>}
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
                    placeholder="Введите название сайта"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название в футере</label>
                  <input
                    type="text"
                    value={settings.footerCompanyName}
                    onChange={(e) => setSettings({ ...settings, footerCompanyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Введите название компании для футера"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Введите контактный номер телефона"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Введите контактную почту"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Введите адрес"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Режим работы</label>
                  <input
                    type="text"
                    value={settings.workingHours}
                    onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Введите время работы"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание сайта</label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Введите описание сайта"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка ВКонтакте</label>
                  <input
                    type="text"
                    value={settings.vkLink}
                    onChange={(e) => setSettings({ ...settings, vkLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder='Введите ссылку ВКонтакте'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка Telegram</label>
                  <input
                    type="text"
                    value={settings.telegramLink}
                    onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder='Введите ссылку Telegram'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Второго описания (под кнопкой)</label>
                  <textarea
                    value={settings.guaranteeText}
                    onChange={(e) => setSettings({ ...settings, guaranteeText: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder='Второе описание'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Политика конфиденциальности</label>
                  <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
                    <style jsx global>{`
                      .ql-editor {
                        color: #1f2937 !important;
                        font-size: 16px;
                      }
                      .ql-toolbar {
                        border-top: none !important;
                        border-left: none !important;
                        border-right: none !important;
                        background-color: #f9fafb;
                      }
                    `}</style>
                    <ReactQuill
                      theme="snow"
                      value={settings.privacyPolicy}
                      onChange={(content: any) => setSettings({ ...settings, privacyPolicy: content })}
                      className="h-80 bg-white"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
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
                  <IconPicker value={newService.icon} onChange={(icon) => setNewService({ ...newService, icon })} />
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
                  <IconPicker value={newAdvantage.icon} onChange={(icon) => setNewAdvantage({ ...newAdvantage, icon })} />
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