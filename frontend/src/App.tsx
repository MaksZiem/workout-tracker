import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "./components/navigation/navbar";
import SectionArrow from "./components/navigation/SectionArrow";
import { memberships } from "./models/Membership";
import Footer from "./components/content/Footer";

function App() {
  const { scrollY } = useScroll();

  const yGreen = useTransform(scrollY, [0, 500], [0, 0]);

  // Animation for membership section
  const membershipY = useTransform(scrollY, [400, 800], [100, 0]);
  const membershipOpacity = useTransform(scrollY, [400, 800], [0, 1]);
  const membershipBlur = useTransform(scrollY, [400, 800], [10, 0]);


  const y1 = useTransform(scrollY, [1000, 1500], [0, 0]);
  const y2 = useTransform(scrollY, [1500, 2000], [0, 0]);
  const y3 = useTransform(scrollY, [2000, 2500], [0, 0]);

  return (
    <div className="font-sans relative z-0">
      <Navbar />
      <section className="relative h-screen w-full text-white">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover -z-10"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="relative z-10 flex items-center justify-center h-auto pt-120 text-7xl font-bold"
        >
          <div className="relative pb-4">
            <span className="text-black text-center">
              Stwórz lepszą wersję siebie
            </span>
            <motion.span
              initial={{ clipPath: "polygon(0 0, 0% 0, 0% 100%, 0 100%)" }}
              animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-0 left-0 text-white pb-4 text-center"
            >
              Stwórz lepszą wersję siebie
            </motion.span>
          </div>
        </motion.div>
        <div className="absolute bottom-10 right-5 transform flex w-40 h-20 opacity-50 bg-white items-center justify-center box-shadow-md rounded-xl gap-5">
          <img
            src="/instagram.png"
            alt="instagram"
            title="instgram"                        
            className="h-2/3 cursor-pointer " 
          />
          <img
            src="/facebook.png"
            alt="facebook"
            className="h-2/3 cursor-pointer"
          />
        </div>
        <SectionArrow />
      </section>

      <div className="relative h-[160vh] bg-white z-10">
        <motion.div
          style={{ y: yGreen }}
          className="sticky top-0 h-screen flex-col justify-center bg-white text-5xl"
        >
          <div className="flex py-15 justify-center items-center">Oferta</div>
          <motion.div
            style={{ 
              y: membershipY,
              opacity: membershipOpacity,
              filter: `blur(${membershipBlur}px)`
            }}
          >
            <h3 className="text-4xl text-center">
              Trenuj tak, jak lubisz – bez ograniczeń!
            </h3>
            <div className="flex justify-center mt-10">
              <div className="text-2xl w-1/2 text-center">
                Wybierz karnet dopasowany do Twojego stylu życia. Niezależnie od
                tego, czy jesteś rannym ptaszkiem, ćwiczysz tylko w weekendy,
                czy szukasz pełnej opieki trenerskiej – mamy coś dla Ciebie.
                Dołącz do naszej społeczności i zacznij działać już dziś!
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="flex justify-center mt-15"
            style={{ 
              y: membershipY,
              opacity: membershipOpacity, 
              filter: `blur(${membershipBlur}px)`
            }}
          >
            <div className="flex w-4/5 overflow-x-auto gap-8 scrollbar-hide snap-x snap-mandatory pb-6">
              {memberships.map((item) => (
                <div
                  key={item.name}
                  className="min-w-[400px] h-[600px] bg-gray-100 flex rounded-2xl shadow-lg p-6 text-center flex-col justify-between"
                >
                  <div className="h-[150px]">
                    <h3 className="text-3xl font-semibold mb-3">{item.name}</h3>
                    <h4 className="text-gray font-semibold text-2xl">
                      {item.price}
                    </h4>
                    <p className="text-gray-700 text-2xl">{item.description}</p>
                  </div>
                  <div className="h-[300px] mt-10">
                    <img src="/paralax.png" className="" alt="" />
                  </div>
                  <div className="h-[80px]">
                    <button className="w-40px text-2xl bg-[#D2B48C] p-3 cursor-pointer shadow-md rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg">
                      Wybierz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <div className="relative h-[300vh] bg-black text-white z-10">
        <motion.div
          style={{ y: y1 }}
          className="sticky top-0 h-screen flex justify-between px-10 bg-black border-t border-gray-300 overflow-hidden"
        >
          {/* <div className="text-6xl mt-20 font-bold z-10">Fueled by Passion</div> */}

          {/* Kontener na nachodzące filmy - po lewej stronie */}
          <div className="relative w-1/2 h-2/3 flex items-center justify-start pl-10">
            {/* Pierwszy film - z tyłu - statyczny */}
            <motion.div
              className="absolute w-160 h-90 bg-gray-800 rounded-lg shadow-2xl z-10"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover rounded-lg grayscale"
              >
                <source src="/personal2.mp4" type="video/mp4" />
              </video>
            </motion.div>
            <motion.div
              className="absolute w-140 h-80 bg-gray-800 rounded-lg shadow-2xl z-20 translate-x-100 translate-y-70"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: -30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover rounded-lg grayscale"
              >
                <source src="/personal1.mp4" type="video/mp4" />
              </video>
            </motion.div>
            {Array.from({ length: 40 }, (_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full ${
                  i % 3 === 0
                    ? "bg-white"
                    : i % 3 === 1
                    ? "bg-gray-300"
                    : "bg-gray-400"
                } ${
                  i % 4 === 0
                    ? "w-1.5 h-1.5"
                    : i % 4 === 1
                    ? "w-1 h-1"
                    : i % 4 === 2
                    ? "w-0.5 h-0.5"
                    : "w-2 h-2"
                }`}
                animate={{
                  x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 5), 0],
                  y: [0, (i % 3 === 0 ? -1 : 1) * (20 + i * 3), 0],
                  opacity: [0.2 + i * 0.03, 0.6 + i * 0.02, 0.2 + i * 0.03],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                style={{
                  top: `${15 + ((i * 6) % 70)}%`,
                  left: `${10 + ((i * 8) % 80)}%`,
                  opacity: 0.2 + (i % 5) * 0.1,
                }}
              />
            ))}
          </div>
          <div className="w-180 mt-40 text-justify">
            <h1 className="text-5xl pr-20">Treningi personalne</h1>
            <div className="text-3xl mt-10 pr-20">
              Indywidualne podejście. Szybsze efekty. Pełna motywacja.
            </div>
            <div className="text-2xl mt-10 pr-20 leading-8">
              Nasi certyfikowani trenerzy personalni pomogą Ci osiągnąć
              konkretny cel – niezależnie od poziomu zaawansowania. Opracujemy
              plan treningowy, zadbamy o technikę i zmotywujemy Cię do
              działania. Trening może dotyczyć redukcji, budowy masy mięśniowej,
              poprawy kondycji lub powrotu do formy po kontuzji.
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ y: y2 }}
          className="sticky top-0 h-screen flex  justify-between px-10 bg-black border-t border-gray-300"
        >
          <div className="relative w-1/2 h-2/3 flex items-center justify-start pl-10">
            {/* Pierwszy film - z tyłu - statyczny */}
            <motion.div
              className="absolute w-160 h-90 bg-gray-800 rounded-lg shadow-2xl z-10"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover rounded-lg grayscale"
              >
                <source src="/groups1.mp4" type="video/mp4" />
              </video>
            </motion.div>
            <motion.div
              className="absolute w-140 h-80 bg-gray-800 rounded-lg shadow-2xl z-20 translate-x-100 translate-y-70"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: -30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover rounded-lg grayscale"
              >
                <source src="/groups3.mp4" type="video/mp4" />
              </video>
            </motion.div>
            {Array.from({ length: 40 }, (_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full ${
                  i % 3 === 0
                    ? "bg-white"
                    : i % 3 === 1
                    ? "bg-gray-300"
                    : "bg-gray-400"
                } ${
                  i % 4 === 0
                    ? "w-1.5 h-1.5"
                    : i % 4 === 1
                    ? "w-1 h-1"
                    : i % 4 === 2
                    ? "w-0.5 h-0.5"
                    : "w-2 h-2"
                }`}
                animate={{
                  x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 5), 0],
                  y: [0, (i % 3 === 0 ? -1 : 1) * (20 + i * 3), 0],
                  opacity: [0.2 + i * 0.03, 0.6 + i * 0.02, 0.2 + i * 0.03],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                style={{
                  top: `${15 + ((i * 6) % 70)}%`,
                  left: `${10 + ((i * 8) % 80)}%`,
                  opacity: 0.2 + (i % 5) * 0.1,
                }}
              />
            ))}
          </div>
          <div className="w-180 mt-40 text-justify">
            <h1 className="text-5xl pr-20">Zajęcia grupowe fitness</h1>
            <div className="text-3xl mt-10 pr-20">
              Trenuj w rytmie dobrej energii. Razem raźniej!
            </div>
            <div className="text-2xl mt-10 pr-20 leading-8">
              Nasze zajęcia grupowe to świetny sposób na spalanie kalorii,
              poprawę formy i dobrą zabawę. Znajdziesz tu różnorodne treningi:
              od cardio i wzmacniania, przez zdrowy kręgosłup i stretching, aż
              po intensywny cross training. Zajęcia prowadzą doświadczeni
              instruktorzy, a atmosfera motywuje do działania.
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ y: y3 }}
          className="sticky top-0 h-screen flex justify-between px-10 bg-black border-t border-gray-300"
        >
          <div className="text-6xl mt-20 font-bold">
            Improve by 1% Every Day
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default App;