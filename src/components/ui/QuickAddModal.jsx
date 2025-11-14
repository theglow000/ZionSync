import React, { useState, useEffect } from "react";
import { X as XIcon, Calendar, AlertCircle } from "lucide-react";
import { LoadingSpinner, EmptyState } from "../shared";
import { fetchWithTimeout } from "../../lib/api-utils";

const QuickAddModal = ({ isOpen, onClose, song }) => {
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [songSlots, setSongSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen && song) {
      // Reset state before fetching new data
      setSelectedService(null);
      setSongSlots([]);
      setMessage("");
      setError(null);

      // Then fetch services
      fetchUpcomingServices();
    }

    // When modal closes, reset state as before
    if (!isOpen) {
      setSelectedService(null);
      setSongSlots([]);
      setMessage("");
      setError(null);
    }
  }, [isOpen, song]);

  // Wrapped onClose to reset state
  const handleClose = () => {
    setSelectedService(null);
    setMessage("");
    onClose();
  };

  // Fetch upcoming services - using the approach from SongDatabase
  const fetchUpcomingServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch upcoming services with their full details
      const response = await fetchWithTimeout("/api/upcoming-services?limit=8");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Unable to load services`);
      }

      // Handle different response structures
      const responseData = await response.json();
      const services = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData.value)
          ? responseData.value
          : [];

      // Process the services data
      const enhancedServices = services.map((service) => {
        // Identify song positions that need to be filled
        const songPositions =
          service.elements
            ?.filter((element) => element.type === "song_hymn")
            .map((element, index) => {
              // Extract label from content
              const label =
                element.content?.split(":")[0]?.trim() || `Song ${index + 1}`;

              // Check if this position already has a song
              const hasSelection = !!element.selection;

              return {
                id: `song_${index}`,
                label,
                hasSelection,
                selectionDetails: element.selection
                  ? {
                      title: element.selection.title,
                      type: element.selection.type,
                      number: element.selection.number,
                      hymnal: element.selection.hymnal,
                      author: element.selection.author,
                    }
                  : null,
              };
            }) || [];

        // Get service type display name
        let serviceTypeDisplay = "Sunday Service";
        if (service.type) {
          serviceTypeDisplay =
            service.type === "communion"
              ? "Communion"
              : service.type === "communion_potluck"
                ? "Communion & Potluck"
                : service.type === "no_communion"
                  ? "No Communion"
                  : "Custom Service";
        }

        return {
          ...service,
          songPositions,
          serviceTypeDisplay,
        };
      });

      if (enhancedServices.length === 0) {
        setError("No upcoming services found. Please create a service first.");
      } else {
        setUpcomingServices(enhancedServices);
      }
    } catch (err) {
      console.error("Failed to fetch upcoming services:", err);
      setError("Failed to load upcoming services. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle service selection
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSongSlots(service.songPositions || []);
  };

  // Add song to the selected slot
  const addSongToSlot = async (position) => {
    if (!selectedService || !position) return;

    try {
      setIsAdding(true);
      setError(null);

      // Use the working API endpoint and correct parameter structure
      const response = await fetchWithTimeout("/api/reference-songs/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceSongId: song._id,
          serviceDate: selectedService.date,
          position: position,
          songData: {
            type: song.type,
            title: song.title,
            number: song.number || "",
            hymnal: song.hymnal || "",
            author: song.author || "",
            youtube: song.youtubeLink || "",
            notes: song.notes || "",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error adding song to service:", errorData);
        throw new Error(errorData.message || "Failed to add song to service");
      }

      setMessage(
        `"${song.title}" successfully added to ${selectedService.title}`,
      );
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Error adding song to service:", err);
      setError("Failed to add song to service. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            Add "{song?.title}" to a Service
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle className="text-red-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">{error}</p>
                <button
                  onClick={fetchUpcomingServices}
                  className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : message ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
              <p className="text-green-700 font-medium">{message}</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="border-purple-500" />
              <p className="mt-2 text-gray-500">Loading services...</p>
            </div>
          ) : (
            <div>
              {selectedService ? (
                <>
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="font-medium">{selectedService.title}</h3>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(selectedService.date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="ml-auto text-sm text-blue-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <p className="mb-2 font-medium">Select position:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {songSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => addSongToSlot(slot.id)}
                        disabled={isAdding}
                        className={`w-full text-left p-2 border rounded hover:bg-gray-50 ${
                          slot.hasSelection ? "bg-gray-100" : ""
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{slot.label}</span>
                          {slot.hasSelection && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Will replace existing
                            </span>
                          )}
                        </div>
                        {slot.hasSelection && slot.selectionDetails && (
                          <div className="text-sm text-gray-500 mt-1">
                            Current: {slot.selectionDetails.title}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 font-medium">Select a service:</p>
                  <div className="space-y-1.5">
                    {upcomingServices.length === 0 ? (
                      <EmptyState
                        icon={Calendar}
                        title="No Upcoming Services"
                        message="Services will appear here when scheduled."
                        size="sm"
                      />
                    ) : (
                      upcomingServices.map((service) => (
                        <div
                          key={service._id}
                          onClick={() => handleServiceSelect(service)}
                          className="w-full text-left p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {service.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(service.date).toLocaleDateString()} •{" "}
                                {service.serviceTypeDisplay}
                              </div>
                            </div>
                            <div className="text-purple-600 text-sm ml-2">
                              Select
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
