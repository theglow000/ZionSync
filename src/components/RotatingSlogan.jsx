import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const slogans = [
  "Harmonizing Ministry Teams for God's Glory",
  "Unite • Coordinate • Serve",
  "Uniting Teams, Amplifying Worship",
  "Empowering Ministry Teams, Enriching Worship",
  "Coordinate with Purpose, Serve with Passion",
  "Your Ministry Command Center",
  "Orchestrating Ministry Excellence Together",
];

const DISPLAY_DURATION = 8000; // 8 seconds per slogan

const RotatingSlogan = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const rotateSlogan = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slogans.length);
      setIsTransitioning(false);
    }, 1000); // Animation duration
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateSlogan, DISPLAY_DURATION);
    return () => {
      clearInterval(interval);
    };
  }, [rotateSlogan]);

  return (
    <div className="h-[60px] sm:h-[40px] relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 30, rotateX: 30 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -30, rotateX: -30 }}
          transition={{
            duration: 1, // 1 second transition
            ease: "easeOut",
            opacity: { duration: 0.8 },
          }}
          className="text-xl sm:text-2xl md:text-3xl text-white/95 font-light absolute w-full"
          style={{
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            letterSpacing: "1px",
          }}
        >
          {slogans[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default RotatingSlogan;
