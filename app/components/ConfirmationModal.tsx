// components/ConfirmationModal.tsx
'use client';

import React from 'react';

export default function ConfirmationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">You're on the waitlist! 🎉</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your've been added to the waitlist successfully!
        </p>
        <button
          onClick={onClose}
          className="rounded bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
