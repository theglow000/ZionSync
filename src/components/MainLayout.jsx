"use client";

import React, { useState, useEffect, Suspense } from "react";
import SignupSheet from "./ui/SignupSheet";
import AVTeam from "./ui/AVTeam";
import WorshipTeam from "./ui/WorshipTeam";
import Settings from "./Settings";
import SplashScreen from "./SplashScreen";
import ErrorBoundary from "./ErrorBoundary";
import { IoHomeOutline } from "react-icons/io5";
import { IoSettingsOutline } from "react-icons/io5";
import useResponsive from "../hooks/useResponsive";
import { useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "../lib/api-utils";

// Desktop tab button component
const TabButton = ({ active, label, onClick, colors, isHome, isSettings }) => (
  <div
    className={`
      relative w-14 ${isHome || isSettings ? "h-11" : "h-32"} cursor-pointer
      ${active ? "z-20" : "z-10 hover:brightness-110"}
    `}
    onClick={onClick}
  >
    <div
      className={`
      absolute top-0 left-0 w-full h-full
      ${colors.bg}
      flex flex-col items-center justify-center
      rounded-l-lg
      ${active ? "shadow-lg" : "brightness-90"}
      transition-all duration-200
    `}
    >
      {!active && (
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gray-300" />
      )}

      {isHome ? (
        <IoHomeOutline className={`text-xl ${colors.text}`} />
      ) : isSettings ? (
        <IoSettingsOutline className={`text-xl ${colors.text}`} />
      ) : (
        <span
          className={`
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            transform -rotate-90 whitespace-nowrap
            text-sm font-medium
            ${colors.text}
          `}
          style={{ transformOrigin: "center" }}
        >
          {label}
        </span>
      )}
    </div>
  </div>
);

// New mobile bottom tab button component with lighter colors when inactive
const MobileTabButton = ({
  active,
  label,
  onClick,
  colors,
  isHome,
  isSettings,
}) => (
  <button
    className={`
      flex-1 flex flex-col items-center justify-center py-2
      min-h-[56px] touch-manipulation
      ${active ? colors.bg : colors.bgLight}
      transition-colors duration-200
    `}
    onClick={onClick}
  >
    <div className="flex flex-col items-center">
      {isHome ? (
        <IoHomeOutline
          className={`text-xl ${active ? colors.text : colors.textLight}`}
        />
      ) : isSettings ? (
        <IoSettingsOutline
          className={`text-xl ${active ? colors.text : colors.textLight}`}
        />
      ) : (
        <span
          className={`text-sm font-medium ${active ? colors.text : colors.textLight}`}
        >
          {label}
        </span>
      )}
    </div>
  </button>
);

// Create a client component that safely uses useSearchParams
const TabInitializer = ({ setActiveTab, setShowSplash }) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
      setShowSplash(false);
    }
  }, [searchParams, setActiveTab, setShowSplash]);

  return null;
};

const MainLayout = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("presentation");
  const [serviceDetails, setServiceDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isMobile } = useResponsive();

  // Sprint 4.2: Year state management
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  // Sprint 4.2: Fetch available years and set smart default
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const response = await fetchWithTimeout(
          "/api/service-calendar/available-years",
        );
        if (!response.ok) {
          console.error("Failed to fetch available years");
          // Fallback to current year if API fails
          setSelectedYear(currentYear);
          return;
        }

        const years = await response.json();
        setAvailableYears(years);

        // Smart default: current year if available, else most recent
        if (years.includes(currentYear)) {
          setSelectedYear(currentYear);
        } else if (years.length > 0) {
          // Use most recent available year
          const sortedYears = [...years].sort((a, b) => b - a);
          setSelectedYear(sortedYears[0]);
        } else {
          // No years generated yet, default to current year
          setSelectedYear(currentYear);
        }
      } catch (error) {
        console.error("Error fetching available years:", error);
        // Fallback to current year on error
        setSelectedYear(currentYear);
      }
    };

    fetchAvailableYears();
  }, [currentYear]);

  // Add this useEffect to fetch service details
  useEffect(() => {
    // Track if the component is mounted
    let isMounted = true;
    // Track active timeouts to clear them if needed
    let retryTimeoutId = null;
    let fetchTimeoutId = null;

    const fetchServiceDetails = async () => {
      // Clear any existing retry timeout
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }

      // Only proceed if component is still mounted
      if (!isMounted) return;

      const controller = new AbortController();

      try {
        // Set a timeout that's slightly longer than the fetch timeout
        fetchTimeoutId = setTimeout(() => {
          if (isMounted) {
            controller.abort();
          }
        }, 8000); // 8 second timeout

        const response = await fetchWithTimeout("/api/service-details", {
          signal: controller.signal,
          // Add cache control to prevent stale data
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        // Clear the fetch timeout as the request completed
        clearTimeout(fetchTimeoutId);
        fetchTimeoutId = null;

        // Only proceed if component is still mounted
        if (!isMounted) return;

        if (!response.ok) {
          throw new Error(
            `Failed to fetch service details: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        // Only proceed if component is still mounted
        if (!isMounted) return;

        // Convert array to object with date keys
        const detailsObj = {};
        // Defensive check: ensure data is an array
        if (Array.isArray(data)) {
          data.forEach((detail) => {
            if (detail.date) {
              detailsObj[detail.date] = detail;
            }
          });
        }

        setServiceDetails(detailsObj);
        setIsLoading(false);
      } catch (error) {
        // Only handle errors if component is still mounted
        if (!isMounted) return;

        console.error("Error fetching service details:", error);

        if (error.name === "AbortError") {
          retryTimeoutId = setTimeout(() => {
            if (isMounted) {
              fetchServiceDetails();
            }
          }, 5000);
        } else {
          // For non-abort errors, set loading to false
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchServiceDetails();

    // Set up polling to keep data fresh, but with a longer interval
    const pollingIntervalId = setInterval(() => {
      if (isMounted) {
        fetchServiceDetails();
      }
    }, 60000); // Poll every 60 seconds instead of 30 to reduce server load

    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;

      // Clear all timeouts and intervals
      if (fetchTimeoutId) clearTimeout(fetchTimeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      clearInterval(pollingIntervalId);
    };
  }, []);

  const tabs = [
    {
      id: "home",
      label: "Home",
      colors: {
        bg: "bg-gray-800",
        bgLight: "bg-gray-100",
        text: "text-white",
        textLight: "text-gray-700",
      },
      background: "",
      isHome: true,
    },
    {
      id: "presentation",
      label: "Presentation",
      colors: {
        bg: "bg-[#6B8E23]",
        bgLight: "bg-[#e4ecd4]",
        text: "text-white",
        textLight: "text-[#6B8E23]",
      },
      background: 'url("/palms.jpg")',
    },
    {
      id: "worship",
      label: "Worship",
      colors: {
        bg: "bg-purple-700",
        bgLight: "bg-purple-50",
        text: "text-white",
        textLight: "text-purple-700",
      },
      background: 'url("/worshipbg.jpg")',
    },
    {
      id: "av",
      label: "Audio/Video",
      colors: {
        bg: "bg-red-700",
        bgLight: "bg-red-50",
        text: "text-white",
        textLight: "text-red-700",
      },
      background: 'url("/audio_videobg.jpg")',
    },
    {
      id: "settings",
      label: "Settings",
      colors: {
        bg: "bg-gray-600",
        bgLight: "bg-gray-100",
        text: "text-white",
        textLight: "text-gray-600",
      },
      background: "",
      isSettings: true,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  if (showSplash) {
    return (
      <div className="w-full min-h-screen">
        <Suspense fallback={null}>
          <TabInitializer
            setActiveTab={setActiveTab}
            setShowSplash={setShowSplash}
          />
        </Suspense>
        <SplashScreen
          onEnter={() => setShowSplash(false)}
          setActiveTab={setActiveTab}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-500"
      style={{ backgroundImage: activeTabData.background }}
    >
      <Suspense fallback={null}>
        <TabInitializer
          setActiveTab={setActiveTab}
          setShowSplash={setShowSplash}
        />
      </Suspense>
      {isMobile ? (
        <div className="min-h-screen flex flex-col relative">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <div className="bg-white shadow-md h-full flex flex-col">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : (
                <div
                  className="flex-1 overflow-y-auto"
                  style={{ paddingBottom: "76px" }}
                >
                  {" "}
                  {/* Fixed padding for safe area */}
                  {activeTab === "presentation" && (
                    <ErrorBoundary>
                      <SignupSheet
                        serviceDetails={serviceDetails}
                        setServiceDetails={setServiceDetails}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        availableYears={availableYears}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "worship" && (
                    <ErrorBoundary>
                      <WorshipTeam
                        serviceDetails={serviceDetails}
                        setServiceDetails={setServiceDetails}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        availableYears={availableYears}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "av" && (
                    <ErrorBoundary>
                      <AVTeam
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        availableYears={availableYears}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "settings" && (
                    <ErrorBoundary>
                      <Settings />
                    </ErrorBoundary>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom navigation with higher z-index */}
          <div
            className="fixed bottom-0 left-0 right-0 flex items-center bg-white shadow-lg border-t border-gray-200 z-[100]"
            style={{
              height: "56px",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {tabs.map((tab) => (
              <MobileTabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                onClick={() =>
                  tab.id === "home" ? setShowSplash(true) : setActiveTab(tab.id)
                }
                colors={tab.colors}
                isHome={tab.isHome}
                isSettings={tab.isSettings}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-screen p-8">
          <div className="flex max-w-7xl mx-auto h-[calc(100vh-4rem)]">
            {/* Left side tabs */}
            <div className="relative flex flex-col gap-1 pt-4 -mr-[1px]">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  label={tab.label}
                  onClick={() =>
                    tab.id === "home"
                      ? setShowSplash(true)
                      : setActiveTab(tab.id)
                  }
                  colors={tab.colors}
                  isHome={tab.isHome}
                  isSettings={tab.isSettings}
                />
              ))}
            </div>

            {/* Main content area - add overflow handling */}
            <div className="flex-1 bg-white shadow-xl relative z-0 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  {activeTab === "presentation" && (
                    <ErrorBoundary>
                      <SignupSheet
                        serviceDetails={serviceDetails}
                        setServiceDetails={setServiceDetails}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        availableYears={availableYears}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "worship" && (
                    <ErrorBoundary>
                      <WorshipTeam
                        serviceDetails={serviceDetails}
                        setServiceDetails={setServiceDetails}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        availableYears={availableYears}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "av" && (
                    <ErrorBoundary>
                      <AVTeam
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        availableYears={availableYears}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "settings" && (
                    <ErrorBoundary>
                      <Settings />
                    </ErrorBoundary>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
