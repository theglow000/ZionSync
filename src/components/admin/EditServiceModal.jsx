'use client'

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Save } from 'lucide-react';
import { fetchWithTimeout } from '../../lib/api-utils';

// Predefined liturgical colors in chronological order (Epiphany to Christmas)
const LITURGICAL_COLORS = [
  { name: 'Epiphany Blue', value: '#118AB2' },
  { name: 'Lent Deep Red', value: '#7F0000' },
  { name: 'Holy Week Black', value: '#000000' },
  { name: 'Easter Gold', value: '#FFD700' },
  { name: 'Pentecost Red', value: '#FF4500' },
  { name: 'Ordinary Time Green', value: '#228B22' },
  { name: 'Advent Purple', value: '#614080' },
  { name: 'Christmas White', value: '#FFFFFF' },
  { name: 'Custom Color', value: 'custom' }
];

const EditServiceModal = ({ isOpen, onClose, service, year, onSuccess }) => {
  const [formData, setFormData] = useState({
    seasonName: '',
    seasonColor: '',
    specialDayName: '',
    isActive: true,
    overrideReason: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize form data when service changes
  useEffect(() => {
    if (service) {
      const isCustomColor = !LITURGICAL_COLORS.some(c => c.value === service.seasonColor);
      setShowCustomColor(isCustomColor);
      
      setFormData({
        seasonName: service.seasonName || '',
        seasonColor: service.seasonColor || '',
        specialDayName: service.specialDayName || '',
        isActive: service.isActive !== false, // Default to true if undefined
        overrideReason: service.overrideReason || ''
      });
      setError(null);
    }
  }, [service]);

  const handleSave = async () => {
    if (!service) return;

    // Validate override reason if making changes
    const hasChanges = 
      formData.seasonName !== service.seasonName ||
      formData.seasonColor !== service.seasonColor ||
      formData.specialDayName !== service.specialDayName ||
      formData.isActive !== service.isActive;

    if (hasChanges && !formData.overrideReason.trim()) {
      setError('Please provide a reason for the override');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetchWithTimeout('/api/service-calendar/override', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: year,
          dateString: service.dateString,
          overrides: {
            seasonName: formData.seasonName,
            seasonColor: formData.seasonColor,
            specialDayName: formData.specialDayName || null,
            isActive: formData.isActive
          },
          reason: formData.overrideReason,
          userId: 'admin' // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving service:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!service || !service.isOverridden) return;

    if (!confirm('Are you sure you want to revert this service to its original state? This will remove all manual overrides for this service only.')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetchWithTimeout('/api/service-calendar/revert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: year,
          dateString: service.dateString
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revert service');
      }

      onSuccess();
    } catch (err) {
      console.error('Error reverting service:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !service) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverridden = service.isOverridden || formData.seasonName !== service.seasonName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Edit Service
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(service.date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Service Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Date</label>
                <div className="text-sm text-gray-900 mt-1">{service.dateString}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Day of Week</label>
                <div className="text-sm text-gray-900 mt-1">{service.dayOfWeek}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Service Type</label>
                <div className="text-sm text-gray-900 mt-1">
                  {service.isSpecialWeekday ? 'Special Weekday' : 'Sunday Service'}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Original Season</label>
                <div className="text-sm text-gray-900 mt-1">{service.season}</div>
              </div>
            </div>
          </div>

          {/* Warning Banner if Overridden */}
          {isOverridden && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Manual Override Active
                  </h4>
                  <p className="text-sm text-yellow-700">
                    This service has been manually modified. Changes may cause inconsistencies 
                    with the liturgical calendar.
                  </p>
                  {service.overrideReason && (
                    <p className="text-sm text-yellow-700 mt-2">
                      <strong>Previous reason:</strong> {service.overrideReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Season Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season Name
              </label>
              <input
                type="text"
                value={formData.seasonName}
                onChange={(e) => setFormData({ ...formData, seasonName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="e.g., Advent, Lent, Easter"
              />
            </div>

            {/* Season Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season Color
              </label>
              
              {/* Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {!showCustomColor && formData.seasonColor && (
                      <div 
                        className="w-5 h-5 rounded border border-gray-400 flex-shrink-0"
                        style={{ backgroundColor: formData.seasonColor }}
                      />
                    )}
                    <span>
                      {showCustomColor 
                        ? 'Custom Color' 
                        : LITURGICAL_COLORS.find(c => c.value === formData.seasonColor)?.name || 'Select a color'}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {LITURGICAL_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          if (color.value === 'custom') {
                            setShowCustomColor(true);
                          } else {
                            setShowCustomColor(false);
                            setFormData({ ...formData, seasonColor: color.value });
                          }
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                      >
                        {color.value !== 'custom' && (
                          <div 
                            className="w-5 h-5 rounded border border-gray-400 flex-shrink-0"
                            style={{ backgroundColor: color.value }}
                          />
                        )}
                        {color.value === 'custom' && (
                          <div className="w-5 h-5 rounded border-2 border-dashed border-gray-400 flex-shrink-0" />
                        )}
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Color Picker (only shown when Custom is selected) */}
              {showCustomColor && (
                <div className="flex items-center gap-3 mt-3">
                  <input
                    type="color"
                    value={formData.seasonColor}
                    onChange={(e) => setFormData({ ...formData, seasonColor: e.target.value })}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.seasonColor}
                    onChange={(e) => setFormData({ ...formData, seasonColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="#5D3FD3"
                  />
                </div>
              )}
            </div>

            {/* Special Day Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Day Name
                <span className="text-gray-500 font-normal ml-2">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.specialDayName}
                onChange={(e) => setFormData({ ...formData, specialDayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="e.g., Easter Sunday, Christmas Eve"
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Service is active
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-6">
                Inactive services won't appear in schedules
              </p>
            </div>

            {/* Override Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Override
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={formData.overrideReason}
                onChange={(e) => setFormData({ ...formData, overrideReason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Explain why this service needs to be modified..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Required when making changes to ensure audit trail
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {/* Left side - Revert button (only show if service is overridden) */}
          <div>
            {service.isOverridden && (
              <button
                onClick={handleRevert}
                disabled={isSaving}
                className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                Revert to Original
              </button>
            )}
          </div>

          {/* Right side - Cancel and Save buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditServiceModal;
