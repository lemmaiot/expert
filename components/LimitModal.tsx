import React from 'react';

export const LimitModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Limit Reached</h2>
        <p className="text-gray-600 mb-6">
          You've used all your free messages for today. Please log in or sign up to continue chatting.
        </p>
        <div className="flex justify-center space-x-4">
          <button className="bg-slate-200 text-slate-700 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors">
            Log In
          </button>
          <button className="bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-brand-primary-hover transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};