'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">О компании</h3>
            <p className="text-gray-400">
              Профессиональные юридические услуги для физических и юридических лиц.
              Защита ваших интересов - наша главная задача.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Контакты</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Телефон: +7 (999) 123-45-67</li>
              <li>Email: info@example.com</li>
              <li>Адрес: г. Москва, ул. Примерная, д. 1</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white">Главная</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-white">Услуги</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white">О нас</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Контакты</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Юридическая компания. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
} 