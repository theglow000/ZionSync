'use client'

import React, { useState, useEffect } from 'react';
import SignupSheet from './ui/SignupSheet';
import AVTeam from './ui/AVTeam';
import WorshipTeam from './ui/WorshipTeam';
import SplashScreen from './SplashScreen';
import { IoHomeOutline } from "react-icons/io5";

const TabButton = ({ active, label, onClick, colors, isHome }) => (
  <div
    className={`
      relative w-14 ${isHome ? 'h-11' : 'h-32'} cursor-pointer
      ${active ? 'z-20' : 'z-10 hover:brightness-110'}
    `}
    onClick={onClick}
  >
    <div className={`
      absolute top-0 left-0 w-full h-full
      ${colors.bg}
      flex flex-col items-center justify-center
      rounded-l-lg
      ${active ? 'shadow-lg' : 'brightness-90'}
      transition-all duration-200
    `}>
      {!active && (
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gray-300" />
      )}
      
      {isHome ? (
        <IoHomeOutline className={`text-xl ${colors.text}`} />
      ) : (
        <span
          className={`
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            transform -rotate-90 whitespace-nowrap
            text-sm font-medium
            ${colors.text}
          `}
          style={{ transformOrigin: 'center' }}
        >
          {label}
        </span>
      )}
    </div>
  </div>
);

const MainLayout = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('presentation');
  const [serviceDetails, setServiceDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Add this useEffect to fetch service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await fetch('/api/service-details');
        if (!response.ok) throw new Error('Failed to fetch service details');
        const data = await response.json();

        // Convert array to object with date keys
        const detailsObj = {};
        data.forEach(detail => {
          if (detail.date) {
            detailsObj[detail.date] = detail;
          }
        });

        setServiceDetails(detailsObj);
      } catch (error) {
        console.error('Error fetching service details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();

    // Optional: Set up polling to keep data fresh
    const intervalId = setInterval(fetchServiceDetails, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      colors: {
        bg: 'bg-gray-800',
        text: 'text-white',
      },
      background: '',
      isHome: true
    },
    {
      id: 'presentation',
      label: 'Presentation Team',
      colors: {
        bg: 'bg-[#6B8E23]',
        text: 'text-white',
      },
      background: 'url("/palms.jpg")'
    },
    {
      id: 'worship',
      label: 'Worship Team',
      colors: {
        bg: 'bg-purple-700',
        text: 'text-white',
      },
      background: 'url("/worshipbg.jpg")'
    },
    {
      id: 'av',
      label: 'Audio/Video Team',
      colors: {
        bg: 'bg-red-700',
        text: 'text-white',
      },
      background: 'url("/audio_videobg.jpg")'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  if (showSplash) {
    return (
      <div className="w-full min-h-screen">
        <SplashScreen onEnter={() => setShowSplash(false)} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-500"
      style={{ backgroundImage: activeTabData.background }}
    >
      <div className="min-h-screen p-8">
        <div className="flex max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          {/* Left side tabs */}
          <div className="relative flex flex-col gap-1 pt-4 -mr-[1px]">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                onClick={() => tab.id === 'home' ? setShowSplash(true) : setActiveTab(tab.id)}
                colors={tab.colors}
                isHome={tab.isHome}
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
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'presentation' && (
                  <SignupSheet
                    serviceDetails={serviceDetails}
                    setServiceDetails={setServiceDetails}
                  />
                )}
                {activeTab === 'worship' && (
                  <WorshipTeam
                    serviceDetails={serviceDetails}
                    setServiceDetails={setServiceDetails}
                  />
                )}
                {activeTab === 'av' && <AVTeam />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;