'use client'

import React, { useState } from 'react';
import ServiceCalendarManager from './admin/ServiceCalendarManager';

const Settings = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState('calendar');

  const settingsTabs = [
    { id: 'general', label: 'General', disabled: true },
    { id: 'users', label: 'Users', disabled: true },
    { id: 'calendar', label: 'Calendar Manager', disabled: false },
    { id: 'database', label: 'Database', disabled: true },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Horizontal tabs at top */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveSettingsTab(tab.id)}
              disabled={tab.disabled}
              className={`
                px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${activeSettingsTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.disabled && <span className="ml-2 text-xs">(Coming Soon)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeSettingsTab === 'general' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">General Settings</h2>
            <p className="text-gray-600">General application settings will go here.</p>
          </div>
        )}

        {activeSettingsTab === 'users' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
            <p className="text-gray-600">User management features will go here.</p>
          </div>
        )}

        {activeSettingsTab === 'calendar' && (
          <div className="h-full">
            <ServiceCalendarManager />
          </div>
        )}

        {activeSettingsTab === 'database' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Settings</h2>
            <p className="text-gray-600">Database management tools will go here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
