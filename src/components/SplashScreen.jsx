import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const SplashScreen = ({ onEnter, setActiveTab }) => {
    const teamButtons = [
        {
            label: 'Presentation Team',
            color: 'bg-[#6B8E23]',
            hover: 'hover:bg-[#566f1c]',
            tab: 'presentation'
        },
        {
            label: 'Worship Team',
            color: 'bg-purple-700',
            hover: 'hover:bg-purple-800',
            tab: 'worship'
        },
        {
            label: 'Audio/Video Team',
            color: 'bg-red-700',
            hover: 'hover:bg-red-800',
            tab: 'av'
        }
    ];

    const handleTeamSelect = (tab) => {
        setActiveTab(tab);
        onEnter();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" // Removed -mt-[10vh]
        >
            {/* Rebalanced gradient background */}
            <div className="absolute inset-0">
                {/* Existing gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6B8E23] via-purple-700/70 to-red-700 opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-tl from-red-700/50 via-transparent to-[#6B8E23]/50 opacity-40" />
                {/* Add subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                     style={{
                         backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                     }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-20" />
            </div>

            <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center relative z-10 max-w-[95vw] mx-auto space-y-0 -translate-y-[10vh]" // Added -translate-y-[10vh]
            >
                {/* Logo with increased negative margin */}
                <div className="relative mx-auto w-full aspect-square -mb-36
                      max-w-[400px] sm:max-w-[700px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1400px]">
                    <Image
                        src="/ZionSyncLogoLarge.svg"
                        alt="ZionSync Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                        className="drop-shadow-[0_0_50px_rgba(0,0,0,0.4)]"
                    />
                </div>

                {/* Adjusted typography spacing with padding for overflow */}
                <div className="mt-0 pb-4"> {/* Container to handle overflow */}
                    <motion.h1
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90"
                        style={{
                            textShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            letterSpacing: '-2px',
                            lineHeight: '1.1' // Adjusted line height for better text rendering
                        }}
                    >
                        ZionSync
                    </motion.h1>
                    <motion.p
                        className="text-xl sm:text-2xl md:text-3xl mb-16 text-white/95 font-light"
                        style={{
                            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            letterSpacing: '1px'
                        }}
                    >
                        Streamline your ministry team coordination
                    </motion.p>
                </div>

                {/* Enhanced buttons */}
                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                    {teamButtons.map((btn) => (
                        <motion.button
                            key={btn.tab}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleTeamSelect(btn.tab)}
                            className={`
                px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-semibold
                ${btn.color} ${btn.hover}
                transition-all duration-300
                shadow-[0_8px_16px_rgba(0,0,0,0.3)]
                min-w-[200px] sm:min-w-[260px] text-lg sm:text-xl
                backdrop-blur-sm bg-opacity-85
                border border-white/30
                text-white
              `}
                        >
                            {btn.label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;