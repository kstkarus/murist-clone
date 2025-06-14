'use client';

import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Согласие на обработку персональных данных
        </h1>
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600">
            Здесь будет размещено согласие на обработку персональных данных.
            В настоящее время это заглушка для демонстрации функциональности.
          </p>
        </div>
      </motion.div>
    </div>
  );
} 