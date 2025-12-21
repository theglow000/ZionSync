import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import RotatingSlogan from "./RotatingSlogan";
import DotMatrix from "./DotMatrix";

const SplashScreen = ({ onEnter, setActiveTab }) => {
  const teamButtons = [
    {
      label: "Presentation Team",
      color: "bg-[#6B8E23]",
      hover: "hover:bg-[#566f1c]",
      tab: "presentation",
    },
    {
      label: "Worship Team",
      color: "bg-purple-700",
      hover: "hover:bg-purple-800",
      tab: "worship",
    },
    {
      label: "Audio/Video Team",
      color: "bg-red-700",
      hover: "hover:bg-red-800",
      tab: "av",
    },
  ];

  const handleTeamSelect = (tab) => {
    setActiveTab(tab);
    onEnter();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 sm:px-0"
    >
      <DotMatrix />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B8E23] via-purple-700/70 to-red-700 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-tl from-red-700/50 via-transparent to-[#6B8E23]/50 opacity-30" />
      </div>
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
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
        className="text-center relative z-10 w-full mx-auto space-y-6 mt-0 sm:-mt-16"
      >
        <div
          className="
                        relative mx-auto
                        w-full
                        max-w-[320px] h-[240px]
                        sm:max-w-[400px] sm:h-[300px]
                        md:max-w-[700px] md:h-[500px]
                    "
        >
          <Image
            src="/ZionSyncLogoLarge.svg"
            alt="ZionSync Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
            className="drop-shadow-[0_0_50px_rgba(0,0,0,0.4)]"
          />
        </div>

        <div className="space-y-2">
          <motion.h1
            className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90"
            style={{
              textShadow: "0 4px 12px rgba(0,0,0,0.4)",
              letterSpacing: "-2px",
              lineHeight: "1.1",
            }}
          >
            ZionSync
          </motion.h1>
          <div className="mb-8 whitespace-normal break-words leading-normal px-4 sm:px-0">
            <RotatingSlogan />
          </div>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delayChildren: 0.5,
                staggerChildren: 0.2,
              },
            },
          }}
        >
          {teamButtons.map((btn) => (
            <motion.button
              key={btn.tab}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 },
              }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTeamSelect(btn.tab)}
              className={`
                                px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold
                                ${btn.color} ${btn.hover}
                                transition-all duration-300
                                shadow-[0_8px_16px_rgba(0,0,0,0.3)]
                                min-w-[180px] sm:min-w-[220px] text-base sm:text-lg
                                backdrop-blur-sm bg-opacity-85
                                border border-white/30
                                text-white
                                hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)]
                            `}
            >
              {btn.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Version Number - positioned at screen bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-0 right-0 text-center z-20"
      >
        <p className="text-white/70 text-sm md:text-2xl font-medium">v2.2.0</p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
