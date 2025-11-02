//Imports de firebase y otras dependencias ---------------------------------------
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import {addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp,} from "firebase/firestore";
//eslit-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
// --------------------------------------------------------------------------------------
// Se coloca aqui la función para formatear la hora -------------------------
const formatearHora = (timestamp) => {
  if (!timestamp) return "";
  const fecha = timestamp.toDate();
  return fecha.toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Se coloca aqui la función para formatear la fecha -------------------------
const formatearFecha = (timestamp) => {
  if (!timestamp) return "";
  const fecha = timestamp.toDate();
  const hoy = new Date();
  const diferencia =
    new Date(hoy.setHours(0, 0, 0, 0)) -
    new Date(fecha.setHours(0, 0, 0, 0));
  const unDia = 1000 * 60 * 60 * 24;

  if (diferencia === 0) return "Hoy";
  if (diferencia === unDia) return "Ayer";
  return fecha.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
// --------------------------------------------------------------------------------------
// Componente ChatEvento ------------------------------------------------------
export default function ChatEvento() {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const mensajesRef = useMemo(() => collection(db, "eventos", id, "messages"), [id]);
// --------------------------------------------------------------------------------------
//Esto sirve para cargar el evento y los mensajes en tiempo real -------------------------
  useEffect(() => {
    const cargarEvento = async () => {
      try {
        const evRef = doc(db, "eventos", id);
        const evSnap = await getDoc(evRef);
        if (evSnap.exists()) {
          const data = { id: evSnap.id, ...evSnap.data() };
          setEvento(data);
          
          const q = query(mensajesRef, orderBy("timestamp", "asc"));
          const unsub = onSnapshot(q, (snap) => {
            const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMensajes(arr);
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          });
          return () => unsub();
        } else {
          toast.error("Evento no encontrado.");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar el chat.");
      } finally {
        setCargando(false);
      }
    };
    cargarEvento();
  }, [id, mensajesRef, navigate]);
// --------------------------------------------------------------------------------------
// Verifica si el usuario puede hablar dentro del chat, si es que esta suscrito o creador del evento -------------------------
  const puedeHablar = useMemo(() => {
    if (!user || !evento) return false;
    const subs = Array.isArray(evento.suscriptores) ? evento.suscriptores : [];
    return subs.includes(user.uid) || evento.creadorId === user.uid;
  }, [user, evento]);
// --------------------------------------------------------------------------------------
// Función para enviar mensajes -------------------------
  const enviar = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Debes iniciar sesión");
    if (!puedeHablar) return toast.error("No estás suscrito a este evento.");
    const msg = texto.trim();
    if (!msg) return;

    try {
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      const apodo = userData.apodo || user.displayName || "Usuario";

      await addDoc(mensajesRef, {
        texto: msg,
        userId: user.uid,
        userName: apodo,
        timestamp: serverTimestamp(),
      });
      setTexto("");
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar mensaje.");
    }
  };

  // Agrupar por fecha
  const mensajesPorDia = mensajes.reduce((acc, msg) => {
    const fecha = msg.timestamp ? formatearFecha(msg.timestamp) : "Sin fecha";
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(msg);
    return acc;
  }, {});

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
        <motion.div
          className="text-xl text-purple-400 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        >
          Conectando al chat...
        </motion.div>
      </div>
    );
  }
  // --------------------------------------------------------------------------------------
  // Inicio del componente principal del chat --------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh)] bg-gray-900 text-white">
      <Toaster position="top-center" reverseOrder={false} />

      {/* 🔹 Header */}
      <div className="flex-shrink-0 bg-gray-850 border-b border-gray-800 p-3 z-10 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {evento?.imagen && (
            <img
              src={evento.imagen}
              alt="evento"
              className="w-10 h-10 object-cover rounded-full border border-purple-600"
            />
          )}
          <div>
            <h2 className="text-base font-semibold text-purple-400">{evento?.titulo}</h2>
            <p className="text-xs text-gray-400">Chat del evento</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="text-sm text-gray-400 hover:text-white transition">
          ← Lista
        </button>
      </div>

      {/* 🔹 Contenedor de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scroll-personalizado rounded-lg">
        {Object.keys(mensajesPorDia).length === 0 && (
          <p className="text-center text-gray-500 mt-10">Aún no hay mensajes 💬</p>
        )}

        {Object.entries(mensajesPorDia).map(([fecha, msgs]) => (
          <div key={fecha}>
            <div className="flex justify-center my-3">
              <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm">
                {fecha}
              </span>
            </div>
            {msgs.map((m) => {
              const propio = m.userId === user?.uid;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${propio ? "justify-end" : "justify-start"} mb-1`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-md ${
                      propio
                        ? "bg-gradient-to-tl from-purple-700 to-purple-600 text-white rounded-br-none"
                        : "bg-gray-800 text-gray-200 rounded-bl-none"
                    }`}
                  >
                    {!propio && (
                      <div className="text-xs text-purple-400 mb-0.5 font-semibold">
                        {m.userName}
                      </div>
                    )}
                    <div className="leading-snug">{m.texto}</div>
                    {m.timestamp && (
                      <div
                        className={`text-[10px] mt-1 opacity-70 ${
                          propio ? "text-gray-200 text-right" : "text-gray-400 text-right"
                        }`}
                      >
                        {formatearHora(m.timestamp)}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 🔹 Input */}
      <form
        onSubmit={enviar}
        className="flex-shrink-0 p-3 border-t border-gray-800 bg-gray-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={
            puedeHablar
              ? "Escribe un mensaje..."
              : "Debes estar suscrito para participar"
          }
          disabled={!puedeHablar}
          className="flex-1 px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-purple-600 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={!texto.trim() || !puedeHablar}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
            !puedeHablar || !texto.trim()
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
