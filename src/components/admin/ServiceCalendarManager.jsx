"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Edit2,
} from "lucide-react";
import { LoadingSpinner } from "../shared";
import { fetchWithTimeout } from "../../lib/api-utils";
import GenerateServicesModal from "./GenerateServicesModal";
import EditServiceModal from "./EditServiceModal";

const ServiceCalendarManager = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [services, setServices] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [keyDates, setKeyDates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [filterSpecial, setFilterSpecial] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Generate year options (current year - 1 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

  // Fetch services when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchServices();
    }
  }, [selectedYear]);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/service-calendar?year=${selectedYear}`,
      );

      if (response.status === 404) {
        // Year doesn't exist yet
        setServices([]);
        setMetadata(null);
        setKeyDates(null);
        setError(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();
      setServices(data.services || []);
      setMetadata(data.metadata || null);
      setKeyDates(data.keyDates || null);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(err.message);
      setServices([]);
      setMetadata(null);
      setKeyDates(null);
    } finally {
      setIsLoading(false);
    }
  };

  const validateServices = async () => {
    setIsValidating(true);
    try {
      const response = await fetchWithTimeout(
        `/api/service-calendar/validate?year=${selectedYear}`,
      );

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const result = await response.json();
      setValidationResult(result);

      // Auto-hide success message after 5 seconds
      if (result.valid) {
        setTimeout(() => setValidationResult(null), 5000);
      }
    } catch (err) {
      console.error("Error validating services:", err);
      setError("Failed to validate services");
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateSuccess = () => {
    setShowGenerateModal(false);
    fetchServices();
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedService(null);
    fetchServices();
  };

  const filteredServices = filterSpecial
    ? services.filter((s) => s.specialDay || s.isSpecialWeekday)
    : services;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get liturgical color badge
  const getColorBadge = (color) => {
    return (
      <div
        className="w-6 h-6 rounded-full border-2 border-gray-300"
        style={{ backgroundColor: color }}
        title={color}
      />
    );
  };

  return (
    <div className="h-full bg-gray-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={28} />
                Service Calendar Manager
              </h1>
              <p className="text-gray-600 mt-1">
                Generate and manage liturgical service schedules
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Generate Services
            </button>

            {services.length > 0 && (
              <>
                <button
                  onClick={validateServices}
                  disabled={isValidating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isValidating ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Validate
                </button>

                <button
                  onClick={fetchServices}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={18}
                    className={isLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </>
            )}
          </div>

          {/* Metadata Display */}
          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-sm text-gray-600">Total Services</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metadata.totalServices}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Sundays</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metadata.regularSundays}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Special Weekdays</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metadata.specialWeekdays}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Overrides</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metadata.overriddenCount || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div
            className={`rounded-lg p-4 mb-6 ${validationResult.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-start gap-3">
              {validationResult.valid ? (
                <Check
                  className="text-green-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
              ) : (
                <AlertCircle
                  className="text-red-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold ${validationResult.valid ? "text-green-900" : "text-red-900"}`}
                >
                  {validationResult.valid
                    ? "Services are valid!"
                    : "Validation Issues Found"}
                </h3>
                <p
                  className={`text-sm mt-1 ${validationResult.valid ? "text-green-700" : "text-red-700"}`}
                >
                  {validationResult.recommendation}
                </p>
                {validationResult.issues &&
                  validationResult.issues.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validationResult.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-red-700">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                {validationResult.warnings &&
                  validationResult.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validationResult.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-yellow-700">
                          ⚠ {warning}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              <button
                onClick={() => setValidationResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Services Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No services found for {selectedYear}
            </h3>
            <p className="text-gray-600 mb-6">
              Generate services for this year to get started.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Generate Services for {selectedYear}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Filter Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterSpecial}
                  onChange={(e) => setFilterSpecial(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Show special services only
                </span>
              </label>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Season
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Special Day
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50 transition-colors ${service.isOverridden ? "bg-yellow-50" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(service.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {service.dayOfWeek}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {service.seasonName}
                      </td>
                      <td className="px-4 py-3">
                        {getColorBadge(service.seasonColor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {service.specialDayName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            service.isSpecialWeekday
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {service.isSpecialWeekday ? "Weekday" : "Sunday"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEditService(service)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing {filteredServices.length} of {services.length} services
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showGenerateModal && (
        <GenerateServicesModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          selectedYear={selectedYear}
          onSuccess={handleGenerateSuccess}
          existingServices={services.length}
        />
      )}

      {showEditModal && selectedService && (
        <EditServiceModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedService(null);
          }}
          service={selectedService}
          year={selectedYear}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ServiceCalendarManager;
