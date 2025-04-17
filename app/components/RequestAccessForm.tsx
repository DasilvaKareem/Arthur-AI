"use client";

import React, { useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import ConfirmationModal from "../../components/ConfirmationModal";

interface RequestAccessFormProps {
  translations: any;
}

export default function RequestAccessForm({ translations: t }: RequestAccessFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formRef.current) {
      const form = formRef.current;
      const email = form.EMAIL.value;

      try {
        console.log("Submitting email:", email);
        
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        console.log("Waitlist response:", data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to request access');
        }

        // Show success modal even if the user is already registered
        setIsModalOpen(true);
        form.reset();
      } catch (error) {
        console.error('Access request submission error:', error);
        alert('There was an error submitting your request. Please try again later.');
      }
    }
  };

  return (
    <>
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <form
        ref={formRef}
        className="flex flex-col gap-4 items-center"
        onSubmit={handleSubmit}
      >
        <div className="w-full max-w-md">
          <label htmlFor="EMAIL" className="text-left font-medium dark:text-gray-300 text-gray-700">
            {t.home.requestAccess.accessLabel}
          </label>
          <input
            type="email"
            name="EMAIL"
            id="EMAIL"
            placeholder={t.home.requestAccess.email}
            required
            className="w-full rounded dark:border-gray-700 border-gray-300 dark:bg-gray-900/50 bg-white/80 px-4 py-2 text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded w-[200px] bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
        >
          {t.common.requestAccess}
        </button>
      </form>
    </>
  );
} 