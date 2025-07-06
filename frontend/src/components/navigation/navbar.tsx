import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isShrunk, setIsShrunk] = useState(false)
  
  const { scrollY } = useScroll();
  

  const navTextColor = useTransform(
    scrollY,
    [1000, 1100, 2600, 3300], 
    ["#ffffff", "#000000", "#000000", "#ffffff"] 
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsShrunk(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-none ${
        isShrunk ? 'py-4' : 'py-4'
      } px-6 flex items-center justify-between
        ${
          isOpen
            ? 'backdrop-blur-sm bg-white/50'
            : 'bg-transparent'
        }`}
    >
      <motion.div
        style={{ color: navTextColor }}
        className={`font-bold transition-none ${
          isShrunk ? 'text-2xl' : 'text-2xl'
        }`}
      >
        Workout Tracker
      </motion.div>

      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-800 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      <ul
        className={`flex flex-col md:flex-row md:items-center absolute md:static top-full left-0 w-full md:w-auto transition-all duration-300 ease-in ${
          isOpen ? 'block backdrop-blur-sm bg-white/50' : 'hidden md:flex'
        }`}
      >
        <motion.li 
          style={{ color: isOpen ? "#000000" : navTextColor,  cursor: 'pointer' }}
          className="py-2 px-4 hover:text-black cursor-pointer relative group"
        >
          Logowanie / Rejestracja
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
        </motion.li>
        <motion.li 
          style={{ color: isOpen ? "#000000" : navTextColor, cursor: 'pointer' }}
          className="py-2 px-4 hover:text-black cursor-pointer relative group"
        >
          Oferta
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
        </motion.li>
        <motion.li 
          style={{ color: isOpen ? "#000000" : navTextColor, cursor: 'pointer' }}
          className="py-2 px-4 hover:text-black cursor-pointer relative group"
        >
          Trenerzy
          <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
        </motion.li>
        <motion.li 
          style={{ color: isOpen ? "#000000" : navTextColor, cursor: 'pointer' }}
          className="py-2 px-4 hover:text-black cursor-pointer relative group"
        >
          Zapisz się na trening
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
        </motion.li>
        <motion.li 
          style={{ color: isOpen ? "#000000" : navTextColor, cursor: 'pointer' }}
          className="py-2 px-4 hover:text-black cursor-pointer relative group"
        >
          Kontakt
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
        </motion.li>
      </ul>
    </nav>
  )
}