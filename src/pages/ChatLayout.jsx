//Importaciones necesarias de FireStore y dependencias necesarias------
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
//eslit-disable-next-line no-unused-vars
import { motion } from "framer-motion";
// -------------------------------------------------------------------------
// Componente ChatLayout ------------------------------------------------------
export default function ChatLayout() {
  const [eventos, setEventos] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
// -------------------------------------------------------------------------
// Cargar los eventos a los que el usuario está suscrito -------------------------
  useEffect(() => {
    const cargarEventosSuscritos = async () => {
      if (!user) return;
      try {
        const snap = await getDocs(collection(db, "eventos"));
        const sus = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) =>
            Array.isArray(e.suscriptores)
              ? e.suscriptores.includes(user.uid)
              : false
          );
        setEventos(sus);
      } catch (err) {
        console.error("Error al cargar eventos suscritos", err);
      }
    };
    cargarEventosSuscritos();
  }, [user]);
// -------------------------------------------------------------------------
// Render del componente ------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-72 bg-gray-850 border-r border-gray-800 p-4 flex flex-col">
        <h2 className="text-lg font-bold text-purple-400 mb-4">Chat Activos</h2>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {eventos.length === 0 ? (
            <p className="text-gray-500 text-sm">No tienes eventos suscritos.</p>
          ) : (
            eventos.map((ev) => (
              <motion.div
                key={ev.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/chat/${ev.id}`)}
                className={`cursor-pointer bg-gray-800 hover:bg-purple-700/40 rounded-xl p-3 transition-colors shadow-sm ${
                  location.pathname === `/chat/${ev.id}` ? "border border-purple-600" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {ev.imagen ? (
                    <img
                      src={ev.imagen}
                      alt={ev.titulo}
                      className="w-10 h-10 object-cover rounded-full border border-gray-700"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {ev.titulo?.charAt(0) || "E"}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold truncate text-white">{ev.titulo}</h3>
                    <p className="text-xs text-gray-400 truncate">{ev.fecha}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
        >
          ← Volver
        </button>
      </div>

      {/* 🟪 Contenedor del chat */}
      <div className="flex-1 bg-gray-900 relative">
        <Outlet />
      </div>
    </div>
  );
}
