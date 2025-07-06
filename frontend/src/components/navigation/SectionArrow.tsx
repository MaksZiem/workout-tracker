import { motion } from 'framer-motion'
import { MdKeyboardArrowDown } from 'react-icons/md'

const SectionArrow = () => {

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };
  return (
    <>
     {/* Animowana strzałka */}
     <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.8, ease: "easeOut" }}
          onClick={scrollToNextSection}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 0,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative flex flex-col items-center"
          >
            {/* Blur/shadow efekt w tle */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{
                duration: 0,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <MdKeyboardArrowDown
                size={48}
                className="text-white blur-sm opacity-60"
              />
            </motion.div>

            {/* Główna ikona strzałki */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0, duration: 0.5, ease: "easeOut" }}
            >
              <MdKeyboardArrowDown
                size={44}
                className="text-white relative z-10"
              />
            </motion.div>

            {/* Glow efekt */}
            {/* <motion.div
              className="absolute inset-0 bg-white rounded-full opacity-10 blur-lg w-16 h-16 flex items-center justify-center"
              animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ 
                duration: 0, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            /> */}
            <motion.div
              className="absolute inset-0 bg-white rounded-full opacity-30 blur-2xl w-24 h-24 flex items-center justify-center"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Tekst pod strzałką */}
          <motion.p
            className="text-white text-l font-normal mt-3 text-center opacity-70 font-light tracking-widest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.6 }}
          >
            OFERTA
          </motion.p>
        </motion.div>
    </>
  )
}

export default SectionArrow