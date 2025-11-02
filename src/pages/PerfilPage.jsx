//Importaciones necesarias de React y Firebase--------------------------------
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {collection, query, where, getDocs, onSnapshot, updateDoc, doc,getDoc,} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import ModalEvento from "../components/ModalEvento";
//------------------------------------------------------------------------
// Componente principal de la página de perfil de usuario
export default function PerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [apodo, setApodo] = useState("");
  const [eventosSuscrito, setEventosSuscrito] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
// Esto sirve para cargar los datos del perfil del usuario
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setUsuario(user);
    // Función para obtener datos adicionales del usuario
    const obtenerDatos = async () => {
      try {
        //  Obtener apodo del usuario desde Firestore
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setApodo(data.apodo || "");
        }

        //  Obtener eventos donde el usuario está suscrito
        const suscritoQuery = query(
          collection(db, "eventos"),
          where("suscriptores", "array-contains", user.uid)
        );
        const suscritoSnap = await getDocs(suscritoQuery);
        setEventosSuscrito(
          suscritoSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );

        //  Escuchar invitaciones en tiempo real
        const invQ = query(
          collection(db, "invitaciones"),
          where("paraUid", "==", user.uid)
        );
        const unsub = onSnapshot(invQ, (snap) => {
          setInvitaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        return () => unsub();
      } catch (err) {
        console.error("Error obteniendo datos del perfil:", err);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);
// Función para manejar la aceptación o rechazo de una invitación
 const manejarInvitacion = async (id, estado) => {
  try {
    const ref = doc(db, "invitaciones", id);
    await updateDoc(ref, { estado });

    if (estado === "aceptada") {
      // Obtener la invitación completa
      const q = query(collection(db, "invitaciones"), where("__name__", "==", id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const inv = snap.docs[0].data();

        // Agregar al colaborador dentro del evento (campo "colaboradores")
        const eventoRef = doc(db, "eventos", inv.eventoId);
        const eventoSnap = await getDoc(eventoRef);
        if (eventoSnap.exists()) {
          const data = eventoSnap.data();
          const nuevosColaboradores = data.colaboradores || [];
          if (!nuevosColaboradores.includes(inv.paraUid)) {
            await updateDoc(eventoRef, {
              colaboradores: [...nuevosColaboradores, inv.paraUid],
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error actualizando invitación:", error);
  }
};

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-300">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="p-8 text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-center">Mi Perfil</h1>

        {/*  Información del usuario */}
        {usuario && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-6 mb-10 text-center"
          >
            <p className="text-lg font-semibold mb-1">
              {usuario.displayName || "Usuario en sesión"}
            </p>
            <p className="text-gray-500 text-sm">@{apodo || "sin_apodo"}</p>
          </motion.div>
        )}

        {/* Eventos suscritos */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Eventos suscritos
          </h2>

          {eventosSuscrito.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventosSuscrito.map((ev) => (
                <motion.div
                  key={ev.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setEventoSeleccionado(ev)}
                  className="cursor-pointer bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-md hover:shadow-lg transition"
                >
                  {ev.imagen && (
                    <img
                      src={ev.imagen}
                      alt={ev.titulo}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="text-xl font-bold mb-1">{ev.titulo}</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {ev.fecha} • {ev.hora}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {ev.departamento}, {ev.municipio}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">
              Aún no estás suscrito a ningún evento.
            </p>
          )}
        </motion.section>

        {/* Invitaciones recibidas */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Invitaciones recibidas
          </h2>

          {invitaciones.length > 0 ? (
            <div className="space-y-4">
              {invitaciones.map((inv) => (
                <motion.div
                  key={inv.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-md flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {inv.eventoTitulo}
                    </p>
                    <p className="text-gray-400 text-sm">De: {inv.deUid}</p>
                    <p
                      className={`text-sm mt-1 ${
                        inv.estado === "aceptada"
                          ? "text-green-400"
                          : inv.estado === "rechazada"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      Estado: {inv.estado}
                    </p>
                  </div>

                  {inv.estado === "pendiente" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => manejarInvitacion(inv.id, "aceptada")}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => manejarInvitacion(inv.id, "rechazada")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">
              No tienes invitaciones pendientes.
            </p>
          )}
        </motion.section>
      </motion.div>

      {/* Modal del evento seleccionado */}
      <AnimatePresence>
        {eventoSeleccionado && (
          <ModalEvento
            evento={eventoSeleccionado}
            onClose={() => setEventoSeleccionado(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
