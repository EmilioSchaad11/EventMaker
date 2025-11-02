// Importaciones de firebase y dependencias necesarias--------------------------------
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "@emailjs/browser";
//------------------------------------------------------------------------

// Pequeño componente Toast visual
function Toast({ message, type, onClose }) {
  const color =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-yellow-500";
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${color} fixed top-6 right-6 text-white px-4 py-2 rounded-xl shadow-xl z-50`}
    >
      {message}
      <button onClick={onClose} className="ml-3 text-white/70 hover:text-white">
        ✕
      </button>
    </motion.div>
  );
}
// Componente principal de la página de evento público
export default function EventoPublico() {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [yaSuscrito, setYaSuscrito] = useState(false);
  const [toast, setToast] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribiendo, setSubscribiendo] = useState(false);
  const navigate = useNavigate();
// Esto sirve para cargar los datos de los usuarios 
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const ref = doc(db, "eventos", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setEvento(data);

          // Detecta si el usuario ya está suscrito
          const user = auth.currentUser;
          if (user && Array.isArray(data.suscriptores)) {
            setYaSuscrito(data.suscriptores.includes(user.uid));
          }
        }
      } catch (err) {
        setToast({ message: "Error al cargar el evento", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

  //  mostrar toast temporal
  const showToast = (msg, type = "info") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Manejar suscripción al evento
  const handleSubscribe = async () => {
    const user = auth.currentUser;
    if (!user) return setShowLoginPrompt(true);
    if (yaSuscrito) return showToast("Ya estás suscrito a este evento", "info");

    setSubscribiendo(true);

    try {
      const eventoRef = doc(db, "eventos", evento.id);
      await updateDoc(eventoRef, { suscriptores: arrayUnion(user.uid) });

      const emailParams = {
        name: user.displayName || user.email,
        email: user.email,
        event_title: evento.titulo,
        event_date: evento.fecha,
        event_hour: evento.hora,
        event_location: `${evento.departamento}, ${evento.municipio} - ${evento.lugar}`,
        event_link: `${window.location.origin}/e/${evento.id}`,
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE,
        import.meta.env.VITE_EMAILJS_TEMPLATE,
        emailParams,
        import.meta.env.VITE_EMAILJS_PUBLIC
      );

      setYaSuscrito(true);
      showToast("Te has suscrito al evento ", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al suscribirse", "error");
    } finally {
      setSubscribiendo(false);
    }
  };

  const closeModal = () => setShowLoginPrompt(false);
  const goToLogin = () => navigate("/login");

  //  Redirigir segun si hay usuario o no
  const handleGoBack = () => {
    const user = auth.currentUser;
    if (user) navigate("/dashboard");
    else navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <p className="animate-pulse">Cargando evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <p>No se encontró este evento.</p>
      </div>
    );
  }

  const title = evento.titulo || "Evento";
  const desc = `${evento.fecha} · ${evento.departamento}, ${evento.municipio} - ${evento.lugar}`;
  const img = evento.imagen;

  return (
    <HelmetProvider>
      <Helmet>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={img} />
        <meta property="og:url" content={`${window.location.origin}/e/${id}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-gray-100 py-10 px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-6"
        >
          {img && (
            <motion.img
              src={img}
              alt={title}
              className="w-full h-72 object-cover rounded-xl mb-6 shadow-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <h1 className="text-4xl font-extrabold mb-3">{title}</h1>
          <p className="text-gray-400 text-sm mb-4 italic">{desc}</p>

          <div className="text-gray-300 leading-relaxed mb-6">
            {evento.descripcion}
          </div>

          <div className="flex flex-col items-center gap-4">
            {yaSuscrito ? (
              <button
                disabled
                className="bg-green-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg cursor-default opacity-90"
              >
                 Ya estás suscrito
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubscribe}
                disabled={subscribiendo}
                className="bg-yellow-500 text-black font-semibold py-2 px-6 rounded-xl shadow-lg hover:brightness-110 transition"
              >
                {subscribiendo ? "Suscribiendo..." : "Suscribirse al evento"}
              </motion.button>
            )}

            {/*  Botón para volver */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoBack}
              className="text-gray-300 border border-gray-600 hover:border-gray-400 hover:text-white py-2 px-6 rounded-xl transition"
            >
              ← Volver al inicio
            </motion.button>
          </div>
        </motion.div>

        {/* Modal para iniciar sesión */}
        <AnimatePresence>
          {showLoginPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-96 text-center shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-3">
                  Inicia sesión para continuar
                </h2>
                <p className="text-gray-400 mb-6">
                  Necesitas una cuenta para suscribirte a este evento.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={goToLogin}
                    className="bg-yellow-500 text-black font-semibold py-2 rounded-xl hover:brightness-110 transition"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-800 text-gray-300 font-medium py-2 rounded-xl hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </HelmetProvider>
  );
}
