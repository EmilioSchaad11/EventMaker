// src/components/ListaEventosUsuario.jsx
import React, { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";

export default function ListaEventosUsuario({ onEditar }) {
  const [eventos, setEventos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoAEliminar, setEventoAEliminar] = useState(null);

  useEffect(() => {
    const obtenerEventos = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "eventos"),
        where("creadorId", "==", user.uid),
        orderBy("fecha_creacion", "desc")
      );

      const querySnapshot = await getDocs(q);
      const eventosTemp = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Si el documento de evento ya guarda `suscriptores` como array, usar su longitud.
      // Si no existe, hacemos la consulta a la colección "suscripciones" como fallback.
      const eventosConConteo = await Promise.all(
        eventosTemp.map(async (ev) => {
          if (Array.isArray(ev.suscriptores)) {
            return { ...ev, cantidadSuscritos: ev.suscriptores.length };
          } else {
            // Fallback: contar en colección `suscripciones` si existe ese modelo en tu BD
           return { ...ev, cantidadSuscritos: Array.isArray(ev.suscriptores) ? ev.suscriptores.length : 0 };
          }
        })
      );

      setEventos(eventosConConteo);
    };

    obtenerEventos();
  }, []);

  const eliminarEventoConfirmado = async () => {
    if (!eventoAEliminar) return;
    await deleteDoc(doc(db, "eventos", eventoAEliminar.id));
    setEventos(eventos.filter((e) => e.id !== eventoAEliminar.id));
    setModalOpen(false);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg mt-6 relative">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Mis Eventos</h2>

      {eventos.length === 0 ? (
        <p className="text-gray-400">No has creado eventos todavía.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {eventos.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 rounded-lg p-4 shadow border border-gray-700"
              >
                {e.imagen && (
                  <img
                    src={e.imagen}
                    alt={e.titulo}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-100">{e.titulo}</h3>
                <p className="text-gray-400 text-sm mb-1">{e.descripcion}</p>
                <p className="text-gray-300 text-sm">
                  <strong>Fecha:</strong> {e.fecha} &nbsp; <strong>Hora:</strong> {e.hora}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Ubicación:</strong> {e.departamento}, {e.municipio} - {e.lugar}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Categoría:</strong> {e.categoria} &nbsp; <strong>Tipo:</strong> {e.tipo}
                </p>
                {e.cupo && (
                  <p className="text-gray-300 text-sm">
                    <strong>Cupo:</strong> {e.cupo}
                  </p>
                )}

                {/* 👇 Mostrar el número de suscritos */}
                <p className="text-gray-300 text-sm">
                  <strong>Suscritos:</strong> {e.cantidadSuscritos ?? 0}
                </p>

                <p className="text-gray-300 text-sm">
                  <strong>Creador:</strong> {e.creadorNombre}
                </p>

                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => onEditar(e)}
                    className="text-sm text-yellow-400 hover:text-yellow-300 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setEventoAEliminar(e);
                      setModalOpen(true);
                    }}
                    className="text-sm text-red-500 hover:text-red-400 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de confirmación */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 p-6 rounded-2xl shadow-xl text-gray-100 w-80"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-3">Confirmar eliminación</h3>
              <p className="text-gray-300 mb-5">
                ¿Deseas eliminar <strong>{eventoAEliminar?.titulo}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={eliminarEventoConfirmado}
                  className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-red-500 hover:bg-red-500 rounded-lg transition"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
