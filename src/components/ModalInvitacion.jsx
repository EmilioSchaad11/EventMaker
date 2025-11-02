import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function ModalInvitacion({ eventoId, eventoTitulo, onClose }) {
  const [apodo, setApodo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("info");
  const [enviando, setEnviando] = useState(false);

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipo(tipo);
    setTimeout(() => setMensaje(""), 4000);
  };

  const enviarInvitacion = async () => {
    if (!apodo.trim()) return mostrarMensaje("Ingresa un apodo válido.", "warning");

    try {
      setEnviando(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      // Buscar usuario destino por apodo
      const q = query(collection(db, "usuarios"), where("apodo", "==", apodo));
      const snap = await getDocs(q);

      if (snap.empty) {
        mostrarMensaje("No se encontró ningún usuario con ese apodo.", "error");
        return;
      }

      const colaborador = snap.docs[0].data();

      if (colaborador.uid === user.uid) {
        mostrarMensaje("No puedes invitarte a ti mismo 😅", "warning");
        return;
      }

      // Crear documento en /invitaciones
      await addDoc(collection(db, "invitaciones"), {
        deUid: user.uid,
        paraUid: colaborador.uid,
        apodoColaborador: colaborador.apodo,
        eventoId,
        eventoTitulo,
        estado: "pendiente",
        fecha: serverTimestamp(),
      });

      mostrarMensaje("✅ Invitación enviada correctamente.", "success");
      setApodo("");
    } catch (err) {
      console.error(err);
      mostrarMensaje("Error al enviar la invitación.", "error");
    } finally {
      setEnviando(false);
    }
  };

  const colores = {
    success: "border-green-400 text-green-300 bg-green-900/20",
    error: "border-red-400 text-red-300 bg-red-900/20",
    warning: "border-yellow-400 text-yellow-300 bg-yellow-900/20",
    info: "border-blue-400 text-blue-300 bg-blue-900/20",
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-96 shadow-2xl relative"
        >
          {/* Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold text-center text-white mb-4">
            Invitar Colaborador
          </h2>

          <p className="text-gray-400 text-sm text-center mb-3">
            Evento: <span className="text-purple-400 font-semibold">{eventoTitulo}</span>
          </p>

          <input
            type="text"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            placeholder="Apodo del colaborador"
            className="w-full px-4 py-2 mb-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />

          <button
            onClick={enviarInvitacion}
            disabled={enviando}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)] text-white px-4 py-2 rounded-xl transition font-semibold"
          >
            {enviando ? "Enviando..." : "Enviar Invitación"}
          </button>

          {/* Mensaje de estado */}
          <AnimatePresence>
            {mensaje && (
              <motion.div
                key="mensaje"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className={`mt-4 text-center text-sm px-3 py-2 rounded-lg ${colores[tipo]}`}
              >
                {mensaje}
              </motion.div>
            )}
          </AnimatePresence>

          <hr className="border-gray-700 my-4" />

          <p className="text-xs text-gray-500 text-center">
            Solo puedes invitar usuarios registrados en EventMaker.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
