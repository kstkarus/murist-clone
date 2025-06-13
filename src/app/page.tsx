'use client';
import Image from "next/image";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Заявка успешно отправлена!");
        setName("");
        setPhone("");
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans text-gray-900 overflow-x-hidden">
      {/* Баннер */}
      <motion.section
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full bg-white shadow-md py-8 sm:py-10 px-2 sm:px-4 flex flex-col items-center text-center text-gray-900"
      >
        <h1 className="text-2xl sm:text-5xl font-bold mb-3 sm:mb-4">БАНКРОТСТВО ФИЗИЧЕСКИХ ЛИЦ</h1>
        <p className="text-base sm:text-2xl mb-4 sm:mb-6">Избавим вас от непосильных кредитов и долгов!</p>
        <button
          className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition transform hover:scale-105 active:scale-95 duration-200 text-base sm:text-lg min-w-[180px]"
          style={{ touchAction: 'manipulation' }}
          onClick={() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Заказать звонок
        </button>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">Гарантия результата или вернем 100% оплаченной суммы!</p>
      </motion.section>

      {/* Преимущества */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-center text-gray-900"
      >
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">10+</div>
          <div className="text-gray-700">Лет опыта</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">437</div>
          <div className="text-gray-700">Проведённых процедур банкротства</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">314 млн ₽</div>
          <div className="text-gray-700">Списанных долгов</div>
        </div>
      </motion.section>

      {/* Услуги */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 text-gray-900"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Наши услуги</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          {["Банкротство физических лиц", "Арбитражные споры", "Споры с недвижимостью", "Семейные споры"].map((title, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-lg shadow p-2 sm:p-3 flex flex-col items-center text-center min-h-20 hover:shadow-xl hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full mb-1" />
              <div className="font-semibold mb-2 text-xs sm:text-base">{title}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Команда */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 text-gray-900"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Наша команда</h2>
        <div className="flex items-center justify-center min-h-[80px] text-gray-400 text-lg italic">
          Информация о команде появится позже
        </div>
      </motion.section>

      {/* Отзывы */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 text-gray-900"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Отзывы клиентов</h2>
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="italic text-gray-700 mb-2">"Очень помогли с банкротством, всё прошло быстро и профессионально!"</div>
          <div className="text-right text-sm text-gray-500">— Имя клиента</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="italic text-gray-700 mb-2">"Спасибо за консультацию и поддержку на всех этапах!"</div>
          <div className="text-right text-sm text-gray-500">— Имя клиента</div>
        </div>
      </motion.section>

      {/* Контакты и форма обратной связи */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl py-8 sm:py-10 px-2 sm:px-4 flex flex-col md:flex-row gap-6 sm:gap-8 text-gray-900"
      >
        <div className="flex-1 flex items-center justify-center min-h-[60px] sm:min-h-[80px] text-gray-400 text-base sm:text-lg italic">
          Контактная информация появится позже
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
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded hover:bg-blue-700 transition disabled:opacity-60 text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
          {success && <div className="text-green-600 text-xs sm:text-sm mt-2">{success}</div>}
          {error && <div className="text-red-600 text-xs sm:text-sm mt-2">{error}</div>}
        </form>
      </motion.section>

      {/* Футер */}
      <footer className="w-full py-6 text-center text-gray-500 text-sm mt-8 border-t">© {new Date().getFullYear()} Свой Юрист. Все права защищены.</footer>
    </div>
  );
}
