'use client';
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useInitialData } from '@/hooks/useInitialData';
import Loading from './loading';
import Cookies from 'js-cookie';
import * as FiIcons from 'react-icons/fi';

interface Review {
  id: number;
  author: string;
  text: string;
  rating: number;
  photo: string | null;
  order: number;
}

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { settings, services, advantages, team, reviews, isLoading, error: dataError } = useInitialData();
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Управление скроллом во время загрузки
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isLoading]);

  // Получение CSRF-токена
  async function getCsrfToken() {
    try {
      const res = await fetch('/api/csrf');
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.token);
      }
    } catch (error) {
      console.error('Ошибка получения CSRF-токена:', error);
    }
  }

  // Получаем CSRF токен при загрузке страницы
  useEffect(() => {
    getCsrfToken();
  }, []);

  // Маска для телефона
  function formatPhone(input: string, prevValue = "") {
    // Если пользователь начал с +, не мешаем
    if (input.startsWith("+")) {
      let digits = input.replace(/\D/g, "");
      if (digits.startsWith("7")) digits = digits.slice(1);
      let result = "+7";
      if (digits.length > 0) result += " (" + digits.slice(0, 3);
      if (digits.length >= 3) result += ") ";
      if (digits.length >= 3) result += digits.slice(3, 6);
      if (digits.length >= 6) result += " " + digits.slice(6, 8);
      if (digits.length >= 8) result += " " + digits.slice(8, 10);
      return result.trim();
    }
    // Если пользователь начал с 7, 8 или любой цифры
    let digits = input.replace(/\D/g, "");
    if (digits.startsWith("7") || digits.startsWith("8")) {
      digits = digits.slice(1);
    }
    let result = "+7";
    if (digits.length > 0) result += " (" + digits.slice(0, 3);
    if (digits.length >= 3) result += ") ";
    if (digits.length >= 3) result += digits.slice(3, 6);
    if (digits.length >= 6) result += " " + digits.slice(6, 8);
    if (digits.length >= 8) result += " " + digits.slice(8, 10);
    return result.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    setPrivacyError(false);

    // Проверка согласия на обработку персональных данных
    if (!privacyAccepted) {
      setPrivacyError(true);
      setLoading(false);
      return;
    }

    // Проверка номера телефона
    const phonePattern = /^\+7 \(\d{3}\) \d{3} \d{2} \d{2}$/;
    if (!phonePattern.test(phone)) {
      setError("Введите корректный номер телефона в формате +7 (XXX) XXX XX XX");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Заявка успешно отправлена!");
        setName("");
        setPhone("");
        await getCsrfToken();
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Ошибка загрузки данных</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans text-gray-900 overflow-x-hidden">
      {/* Баннер */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-4 mx-auto text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6"
        >
          {settings?.siteName || 'Банкротство физических и юридических лиц'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          {settings?.description || 'Профессиональная помощь в списании долгов через процедуру банкротства. Более 10 лет опыта и сотни успешных дел.'}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 hover-transition"
          >
            Получить консультацию
          </button>
          <a
            href="#advantages"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('advantages')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 hover-transition"
          >
            Узнать больше
          </a>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-sm text-gray-500"
        >
          {settings?.guaranteeText || 'Гарантия результата или вернем 100% оплаченной суммы!'}
        </motion.p>
      </motion.section>

      {/* Преимущества */}
      <motion.section
        id="advantages"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center text-gray-900 mx-auto px-4"
      >
        {advantages.length > 0 ? (
          advantages.map((a, i) => {
            const Icon = a.icon && FiIcons[a.icon as keyof typeof FiIcons];
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center group hover-transition"
              >
                <div className="text-3xl text-blue-600 mb-4">
                  {Icon && <Icon />}
                </div>
                <h3 className="text-lg font-semibold mb-2">{a.label}</h3>
                <p className="text-gray-600 text-center">{a.value}</p>
              </motion.div>
            );
          })
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center group hover-transition"
            >
              <div className="text-3xl text-blue-600 mb-4">
                <FiIcons.FiCheckCircle />
              </div>
              <h3 className="text-lg font-semibold mb-2">Бесплатная консультация</h3>
              <p className="text-gray-600 text-center">Получите бесплатную консультацию от наших специалистов</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center group hover-transition"
            >
              <div className="text-3xl text-blue-600 mb-4">
                <FiIcons.FiShield />
              </div>
              <h3 className="text-lg font-semibold mb-2">Гарантия результата</h3>
              <p className="text-gray-600 text-center">Мы гарантируем результат или вернем деньги</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center group hover-transition"
            >
              <div className="text-3xl text-blue-600 mb-4">
                <FiIcons.FiClock />
              </div>
              <h3 className="text-lg font-semibold mb-2">Быстрое решение</h3>
              <p className="text-gray-600 text-center">Решаем проблемы в кратчайшие сроки</p>
            </motion.div>
          </>
        )}
      </motion.section>

      {/* Услуги */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 mx-auto px-4"
      >
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10 text-gray-900"
        >
          Наши услуги
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center text-gray-900">
          {services.length > 0 ? (
            services.map((s, i) => {
              const Icon = s.icon && FiIcons[s.icon as keyof typeof FiIcons];
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center group border border-gray-100 hover-transition"
                >
                  <div className="text-2xl text-blue-600 mb-4">
                    {Icon ? <Icon /> : s.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
                </motion.div>
              );
            })
          ) :
            <>
              {[
                {
                  key: 'arbitration',
                  icon: <FiIcons.FiBriefcase />,
                  title: 'Арбитражные споры',
                  description: 'Защита интересов в арбитражных судах'
                },
                {
                  key: 'bankruptcy',
                  icon: <FiIcons.FiFileText />,
                  title: 'Банкротство физических лиц',
                  description: 'Списание долгов через процедуру банкротства'
                },
                {
                  key: 'realestate',
                  icon: <FiIcons.FiHome />,
                  title: 'Споры с недвижимостью',
                  description: 'Решение проблем с недвижимым имуществом'
                },
                {
                  key: 'family',
                  icon: <FiIcons.FiUsers />,
                  title: 'Семейные споры',
                  description: 'Юридическая помощь в семейных делах'
                }
              ].map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center group border border-gray-100 hover-transition"
                >
                  <div className="text-2xl text-blue-600 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </>
          }
        </div>
      </motion.section>

      {/* Команда */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 text-gray-900 mx-auto"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Наша команда</h2>
        {team.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center">
            {team.map(member => (
              <div key={member.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center w-full max-w-[300px]">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full object-cover mb-2" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <span className="text-2xl text-gray-500">{member.name[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="font-semibold text-lg mb-1">{member.name}</div>
                <div className="text-blue-600 text-sm mb-1">{member.position}</div>
                <div className="text-gray-600 text-sm">{member.bio}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">Нет информации о команде</div>
        )}
      </motion.section>

      {/* Отзывы */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 text-gray-900 mx-auto"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Отзывы наших клиентов</h2>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center">
            {reviews.map(review => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-md w-full max-w-[300px]">
                <div className="flex items-center mb-4">
                  {review.photo ? (
                    <img src={review.photo} alt={review.author} className="w-12 h-12 rounded-full object-cover mr-4" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <span className="text-gray-500 text-xl">{review.author[0]}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{review.author}</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{review.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">Нет отзывов</div>
        )}
      </motion.section>

      {/* Контакты и форма обратной связи */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 flex flex-col md:flex-row gap-6 sm:gap-8 text-gray-900"
      >
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-xl mb-6 text-gray-800">Наши контакты</h3>
          <div className="space-y-4 w-full">
            {settings?.phone && (
              <div className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${settings.phone}`} className="text-base">{settings.phone}</a>
              </div>
            )}
            {settings?.email && (
              <div className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${settings.email}`} className="text-base">{settings.email}</a>
              </div>
            )}
            {settings?.address && (
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-base">{settings.address}</span>
              </div>
            )}
            {settings?.workingHours && (
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-base">{settings.workingHours}</span>
              </div>
            )}
            <div className="flex gap-4 justify-center mt-6 pt-4 border-t">
              {settings?.vkLink && (
                <a 
                  href={settings.vkLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.712-1.033-1.033-1.489-1.15-1.744-1.15s-.458.117-.458.763v1.088c0 .61-.188.763-1.033.763-1.525 0-3.233-.916-4.497-2.623-1.83-2.57-2.17-4.52-2.17-4.793 0-.22.117-.458.763-.458h1.744c.61 0 .763.33.94 1.03.458 1.712 1.215 3.233 1.525 3.233.33 0 .458-.22.458-1.15v-1.525c-.07-1.033-.22-1.15-.22-1.525 0-.33.33-.458.66-.458h2.743c.61 0 .763.33.763.916v2.743c0 .61.22.763.458.763.33 0 .61-.22 1.15-.763.66-.66 1.525-1.93 1.525-1.93.22-.458.458-.763 1.033-.763h1.744c.763 0 .916.33.763.916-.22 1.033-2.17 3.233-2.17 3.233-.22.33-.33.61 0 .94.22.22 1.033 1.033 1.525 1.712.458.66.916 1.33.916 1.744 0 .61-.33.763-.763.763z"/>
                  </svg>
                </a>
              )}
              {settings?.telegramLink && (
                <a 
                  href={settings.telegramLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.341c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.535.223l.19-2.72 5.18-4.686c.217-.19-.047-.297-.335-.107l-6.4 4.02-2.76-.918c-.6-.2-.61-.6.126-.89l10.8-4.16c.5-.19.94.11.78.89z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <form
          ref={formRef}
          className="flex-1 bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col gap-3 sm:gap-4"
          onSubmit={handleSubmit}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-2">Заказать обратный звонок</h2>
          <input
            type="text"
            placeholder="ФИО"
            className="border rounded px-3 py-2 text-sm sm:text-base"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder={phoneFocused || phone ? "+7 (XXX) XXX XX XX" : "Телефон"}
            className="border rounded px-3 py-2 text-sm sm:text-base"
            value={phone}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            onChange={e => setPhone(formatPhone(e.target.value, phone))}
            required
          />
          <div className={`flex items-start space-x-2 ${privacyError ? 'text-red-600' : ''}`}>
            <input
              type="checkbox"
              id="privacy"
              checked={privacyAccepted}
              onChange={(e) => {
                setPrivacyAccepted(e.target.checked);
                setPrivacyError(false);
              }}
              className={`mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${privacyError ? 'border-red-600' : ''}`}
            />
            <label htmlFor="privacy" className="text-sm text-gray-600">
              Я согласен на обработку{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                персональных данных
              </a>
            </label>
          </div>
          {privacyError && (
            <p className="text-sm text-red-600">Необходимо согласиться с условиями обработки персональных данных</p>
          )}
          {error && <div className="text-red-600 text-xs sm:text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-xs sm:text-sm mt-2">{success}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded hover:bg-blue-700 hover-transition disabled:opacity-60 text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </motion.section>

      {/* Футер */}
      <footer className="w-full py-6 px-4 text-center text-gray-500 text-sm mt-8 border-t">
        <div>© {new Date().getFullYear()} {settings?.siteName || 'Свой Юрист'}. Все права защищены.</div>
      </footer>
    </div>
  );
}
