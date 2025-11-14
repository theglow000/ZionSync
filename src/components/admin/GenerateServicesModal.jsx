"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "../../lib/api-utils";

const GenerateServicesModal = ({
  isOpen,
  onClose,
  selectedYear,
  onSuccess,
  existingServices,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [overwrite, setOverwrite] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setProgress(0);
      setError(null);
      setSuccess(false);
      setGeneratedData(null);
      setOverwrite(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress for better UX
      setProgress(10);

      const response = await fetchWithTimeout(
        "/api/service-calendar/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            year: selectedYear,
            overwrite: overwrite,
          }),
        },
        30000,
      ); // 30 second timeout for generation

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate services");
      }

      const data = await response.json();
      setProgress(100);
      setGeneratedData(data);
      setSuccess(true);

      // Wait a moment before calling onSuccess to show the success message
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Error generating services:", err);
      setError(err.message);
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">
              Generate Services for {selectedYear}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success View
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Success!
              </h3>
              <p className="text-gray-600 mb-6">
                Successfully generated {generatedData?.metadata?.totalServices}{" "}
                services for {selectedYear}
              </p>
              {generatedData?.metadata && (
                <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {generatedData.metadata.totalServices}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {generatedData.metadata.regularSundays}
                    </div>
                    <div className="text-sm text-gray-600">Sundays</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {generatedData.metadata.specialWeekdays}
                    </div>
                    <div className="text-sm text-gray-600">Weekdays</div>
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isGenerating ? (
            // Progress View
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <RefreshCw className="text-blue-600 animate-spin" size={48} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Generating Services...
              </h3>
              <p className="text-gray-600 text-center mb-6">
                This may take a few moments
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center text-sm text-gray-600">
                {progress}%
              </div>
            </div>
          ) : (
            // Initial View
            <>
              {existingServices > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className="text-yellow-600 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">
                        Services Already Exist
                      </h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        {existingServices} services found for {selectedYear}.
                        Choose whether to keep existing services or overwrite
                        them.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={overwrite}
                          onChange={(e) => setOverwrite(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-yellow-900 font-medium">
                          Overwrite existing services
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What will be generated?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <Check
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span>
                        All 52 Sundays of the year with proper liturgical
                        seasons
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span>
                        Special weekday services (Ash Wednesday, Maundy
                        Thursday, Good Friday, etc.)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span>
                        5 midweek Lenten services (Wednesdays during Lent)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span>Thanksgiving Eve and Christmas Eve services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span>
                        Automatic liturgical season and color assignments
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span>
                        Special day detection (Easter, Pentecost, Reformation,
                        etc.)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Expected to generate approximately 63
                    services (52 Sundays + 11 special weekdays). Generation uses
                    the Computus algorithm to calculate Easter and all moveable
                    feasts accurately.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className="text-red-600 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !isGenerating && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateServicesModal;
