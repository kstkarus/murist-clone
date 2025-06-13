'use client';
import { useState, useEffect } from 'react';

interface User {
  username: string;
  role: 'admin' | 'user';
  notify: boolean;
  email?: string;
}

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState('');
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
  
  useEffect(() => {
    // Проверяем localStorage на наличие сессии
    const saved = localStorage.getItem('adminUser');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRequests();
      if (user.role === 'admin') fetchUsers();
    }
    // eslint-disable-next-line
  }, [user, sort]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    } else {
      setError(data.error || 'Ошибка входа');
    }
  }

  async function fetchRequests() {
    const res = await fetch('/api/request');
    if (res.status === 401) return logout();
    const data = await res.json();
    let reqs = data.requests || [];
    // Сортировка
    reqs = reqs.sort((a: any, b: any) => {
      if (sort.field === 'createdAt') {
        return sort.dir === 'asc' ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const av = (a[sort.field] || '').toLowerCase();
        const bv = (b[sort.field] || '').toLowerCase();
        if (av < bv) return sort.dir === 'asc' ? -1 : 1;
        if (av > bv) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      }
    });
    setRequests(reqs);
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
    setUser(null);
    localStorage.removeItem('adminUser');
    await fetch('/api/auth/logout', { method: 'POST' });
  }

  async function handleDeleteRequest(id: number) {
    if (!window.confirm('Удалить заявку?')) return;
    const res = await fetch('/api/request', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.status === 401) return logout();
    fetchRequests();
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-2 sm:p-4 text-gray-900">
      {!user ? (
        <form onSubmit={handleLogin} className="bg-white p-4 sm:p-8 rounded shadow flex flex-col gap-3 sm:gap-4 w-full max-w-xs text-gray-900">
          <h1 className="text-2xl font-bold mb-2 text-center">Вход в админку</h1>
          <input
            type="text"
            placeholder="Логин"
            className="border rounded px-3 py-2 text-sm sm:text-base"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="border rounded px-3 py-2 text-sm sm:text-base"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm sm:text-base">Войти</button>
          {error && <div className="text-red-600 text-xs sm:text-sm text-center">{error}</div>}
        </form>
      ) : (
        <div className="w-full max-w-3xl bg-white p-2 sm:p-6 rounded shadow text-gray-900">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Заявки</h2>
            <button onClick={logout} className="text-blue-600 hover:underline text-sm sm:text-base">Выйти</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Поиск по ФИО или телефону"
              className="border rounded px-2 py-1 w-full sm:w-64 text-sm sm:text-base"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm sm:text-base"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm sm:text-base"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          {requests.length === 0 ? (
            <div className="text-gray-500">Нет заявок</div>
          ) : (
            <div className="overflow-x-auto px-1 sm:px-0 relative">
              <table className="w-full min-w-[500px] border text-xs sm:text-sm text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border font-bold cursor-pointer" onClick={() => handleSort('name')}>
                      ФИО {sort.field === 'name' && (sort.dir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 border font-bold cursor-pointer" onClick={() => handleSort('phone')}>
                      Телефон {sort.field === 'phone' && (sort.dir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 border font-bold cursor-pointer" onClick={() => handleSort('createdAt')}>
                      Дата {sort.field === 'createdAt' && (sort.dir === 'asc' ? '▲' : '▼')}
                    </th>
                    {user.role === 'admin' && <th className="p-2 border font-bold">Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests
                    .filter(r => {
                      const q = search.toLowerCase();
                      return (
                        (!q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)) &&
                        (!dateFrom || new Date(r.createdAt) >= new Date(dateFrom)) &&
                        (!dateTo || new Date(r.createdAt) <= new Date(dateTo + 'T23:59:59'))
                      );
                    })
                    .map(r => (
                      <tr key={r.id}>
                        <td className="p-2 border">{r.name}</td>
                        <td className="p-2 border">{r.phone}</td>
                        <td className="p-2 border">{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                        {user.role === 'admin' && (
                          <td className="p-2 border text-center">
                            <button onClick={() => handleDeleteRequest(r.id)} className="text-red-600 hover:underline text-xs sm:text-sm">Удалить</button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="block sm:hidden text-gray-400 text-xs text-center mt-1">Свайпните вбок для просмотра всей таблицы</div>
            </div>
          )}
          {user.role === 'admin' && (
            <div className="mt-8">
              <h3 className="text-base sm:text-lg font-bold mb-2">Пользователи</h3>
              <div className="overflow-x-auto px-1 sm:px-0 relative">
                <table className="w-full min-w-[600px] border text-xs sm:text-sm mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border font-bold">Логин</th>
                      <th className="p-2 border font-bold">Email</th>
                      <th className="p-2 border font-bold">Роль</th>
                      <th className="p-2 border font-bold">Уведомления</th>
                      <th className="p-2 border font-bold">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="p-2 border">{u.username}</td>
                        <td className="p-2 border">
                          <input
                            type="email"
                            className="border rounded px-2 py-1 w-28 sm:w-40 text-xs sm:text-sm"
                            value={editEmail[u.id] !== undefined ? editEmail[u.id] : (u.email || '')}
                            onChange={e => setEditEmail(prev => ({...prev, [u.id]: e.target.value}))}
                            onBlur={e => handleUpdateEmail(u.id, e.target.value)}
                          />
                        </td>
                        <td className="p-2 border">{u.role}</td>
                        <td className="p-2 border text-center">
                          <input
                            type="checkbox"
                            checked={u.notify}
                            onChange={e => handleUpdateNotify(u.id, e.target.checked)}
                          />
                        </td>
                        <td className="p-2 border text-center">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:underline text-xs sm:text-sm">Удалить</button>
                          <button onClick={() => setShowReset(prev => ({...prev, [u.id]: !prev[u.id]}))} className="ml-2 text-blue-600 hover:underline text-xs sm:text-sm">Сбросить пароль</button>
                          {showReset[u.id] && (
                            <div className="mt-2 flex flex-col gap-1 items-center">
                              <input
                                type="password"
                                className="border rounded px-2 py-1 text-xs sm:text-sm"
                                placeholder="Новый пароль"
                                value={resetPassword[u.id] || ''}
                                onChange={e => setResetPassword(prev => ({...prev, [u.id]: e.target.value}))}
                              />
                              <button onClick={() => handleResetPassword(u.id)} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition text-xs">Сохранить</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="block sm:hidden text-gray-400 text-xs text-center mt-1">Свайпните вбок для просмотра всей таблицы</div>
              </div>
              <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-2 items-end flex-wrap">
                <input
                  type="text"
                  placeholder="Логин"
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  value={newUser.username}
                  onChange={e => setNewUser(u => ({...u, username: e.target.value}))}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  value={newUser.email || ''}
                  onChange={e => setNewUser(u => ({...u, email: e.target.value}))}
                  required
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  value={newUser.password}
                  onChange={e => setNewUser(u => ({...u, password: e.target.value}))}
                  required
                />
                <select
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  value={newUser.role}
                  onChange={e => setNewUser(u => ({...u, role: e.target.value}))}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Руководитель</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newUser.notify}
                    onChange={e => setNewUser(u => ({...u, notify: e.target.checked}))}
                  />
                  Получать уведомления
                </label>
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition text-xs sm:text-sm">Создать</button>
                {userError && <div className="text-red-600 text-xs sm:text-sm ml-2">{userError}</div>}
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 