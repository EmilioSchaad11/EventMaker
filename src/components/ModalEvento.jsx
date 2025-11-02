import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import emailjs from "@emailjs/browser";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ModalEvento({ evento, onClose }) {
  const [subscribiendo, setSubscribiendo] = useState(false);
  const [yaSuscrito, setYaSuscrito] = useState(false);
  const [confirmarDesuscripcion, setConfirmarDesuscripcion] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario ya está suscrito
  useEffect(() => {
    const user = auth.currentUser;
    if (user && Array.isArray(evento.suscriptores) && evento.suscriptores.includes(user.uid)) {
      setYaSuscrito(true);
    }
  }, [evento.suscriptores]);

  // 🔸 Suscribirse al evento (manteniendo EmailJS)
  const suscribirse = async () => {
    const user = auth.currentUser;
    if (!user) return toast.error("Debes iniciar sesión para suscribirte.");
    if (yaSuscrito) return toast("Ya estás suscrito a este evento.");

    setSubscribiendo(true);
    const eventoRef = doc(db, "eventos", evento.id);

    try {
      // Añadir UID a la lista de suscriptores
      await updateDoc(eventoRef, { suscriptores: arrayUnion(user.uid) });
      setYaSuscrito(true);

      // Obtener información del usuario desde Firestore
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Preparar parámetros para EmailJS
      const emailParams = {
        name:
          userData.nombres && userData.apellidos
            ? `${userData.nombres} ${userData.apellidos}`
            : user.displayName || "Usuario",
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

      toast.success("¡Suscripción exitosa! Se envió un correo de confirmación.");
    } catch (err) {
      console.error(err);
      toast.error("Error al suscribirse.");
    } finally {
      setSubscribiendo(false);
    }
  };

  // 🔸 Desuscribirse del evento
  const desuscribirse = async () => {
    const user = auth.currentUser;
    if (!user) return toast.error("Debes iniciar sesión.");

    const eventoRef = doc(db, "eventos", evento.id);
    try {
      await updateDoc(eventoRef, { suscriptores: arrayRemove(user.uid) });
      setYaSuscrito(false);
      toast.success("Te has desuscrito del evento.");
    } catch (err) {
      console.error(err);
      toast.error("Error al desuscribirse.");
    }
  };

  // 🔸 Manejo de confirmación
  const handleDesuscribirse = () => setConfirmarDesuscripcion(true);
  const confirmarDesuscripcionEvent = async () => {
    setConfirmarDesuscripcion(false);
    await desuscribirse();
  };
  const cancelarDesuscripcion = () => setConfirmarDesuscripcion(false);

  // 🔸 Compartir evento (sin cambios)
  const compartirEvento = (plataforma) => {
    const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const url = `${base}/e/${evento.id}`;
    const texto = `¡No te pierdas este evento!\n\n"${evento.titulo}"\n📅 ${evento.fecha} 🕒 ${evento.hora}\n📍 ${evento.departamento}, ${evento.municipio} - ${evento.lugar}\n\n¡Haz clic aquí para más info!`;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + "\n" + url)}`,
    };

    window.open(shareUrls[plataforma], "_blank");
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 rounded-3xl p-6 w-96 max-w-full shadow-xl border border-gray-700 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            {evento.imagen && (
              <img
                src={evento.imagen}
                alt={evento.titulo}
                className="w-full h-56 object-cover rounded-xl mb-4"
              />
            )}

            <h2 className="text-2xl font-bold text-white mb-2">{evento.titulo}</h2>
            <p className="text-gray-300 mb-2">{evento.descripcion}</p>
            <p className="text-gray-400 text-sm mb-1">
              <strong>Fecha:</strong> {evento.fecha} &nbsp; <strong>Hora:</strong> {evento.hora}
            </p>
            <p className="text-gray-400 text-sm mb-1">
              <strong>Lugar:</strong> {evento.departamento}, {evento.municipio} - {evento.lugar}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              <strong>Categoría:</strong> {evento.categoria} &nbsp; <strong>Tipo:</strong> {evento.tipo}
            </p>

            {/* 🔘 Acciones principales */}
            <AnimatePresence mode="wait">
              {yaSuscrito ? (
                <motion.div
                  key="botones-suscrito"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {/* Desuscribirse */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDesuscribirse}
                    className="w-full font-semibold py-2 rounded-xl transition bg-red-600 hover:bg-red-700 text-white"
                  >
                    Desuscribirse
                  </motion.button>

                  {/* 💬 Unirse al chat con fade-in */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/chat/${evento.id}`)}
                    className="w-full font-semibold py-2 rounded-xl transition border-2 border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
                  >
                    💬 Unirse al chat
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="boton-suscribirse"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={suscribirse}
                  disabled={subscribiendo}
                  className="w-full font-semibold py-2 rounded-xl transition bg-yellow-500 text-black hover:brightness-110"
                >
                  {subscribiendo ? "Suscribiendo..." : "Suscribirse"}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Modal de confirmación */}
            <AnimatePresence>
              {confirmarDesuscripcion && (
                <motion.div
                  className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-gray-900 rounded-2xl p-6 w-80 max-w-full shadow-xl border border-gray-700 text-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <p className="text-white mb-4">
                      ¿Estás seguro que quieres desuscribirte?
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={confirmarDesuscripcionEvent}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={cancelarDesuscripcion}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🔗 Compartir evento */}
            <div className="flex justify-center mt-5 space-x-4">
              <button
                onClick={() => compartirEvento("facebook")}
                className="bg-gradient-to-br from-blue-600 to-blue-500 p-4 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transition transform duration-300"
              >
                <FaFacebookF size={24} />
              </button>
              <button
                onClick={() => compartirEvento("x")}
                className="bg-gradient-to-br from-black to-gray-700 p-4 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transition transform duration-300"
              >
                <FaXTwitter size={24} />
              </button>
              <button
                onClick={() => compartirEvento("whatsapp")}
                className="bg-gradient-to-br from-green-500 to-green-400 p-4 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transition transform duration-300"
              >
                <FaWhatsapp size={24} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
