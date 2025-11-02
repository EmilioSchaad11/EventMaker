//Importaciones necesarias de FireStore y dependencias necesarias------ Tambien se importa de components EventoCard y ModalEvento
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import EventoCard from "../components/EventoCard";
import ModalEvento from "../components/ModalEvento";
// -------------------------------------------------------------------------
// Componente Dashboard ------------------------------------------------------
export default function Dashboard() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [cargando, setCargando] = useState(false);

  // Cargar eventos con filtros especificados por el usuario -------------------------
  const cargarEventos = async () => {
    setCargando(true);
    try {
      let filtros = [];
      if (categoria) filtros.push(where("categoria", "==", categoria));
      if (departamento) filtros.push(where("departamento", "==", departamento));

      const q = query(collection(db, "eventos"), ...filtros, orderBy("fecha_creacion", "desc"));
      const snapshot = await getDocs(q);
      let resultados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Búsqueda parcial en título y descripción, funciona por medio de includes -------------------------
      if (busqueda.trim() !== "") {
        const texto = busqueda.toLowerCase();
        resultados = resultados.filter(
          (ev) =>
            ev.titulo?.toLowerCase().includes(texto) ||
            ev.descripcion?.toLowerCase().includes(texto)
        );
      }
      // Actualizar el estado con los eventos filtrados -------------------------
      setEventos(resultados);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, [categoria, departamento, busqueda]);

  // useEffect para abrir evento compartido desde ?evento=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idEvento = params.get("evento");
    if (!idEvento) return;
// Función para abrir el evento compartido -------------------------
    const abrirEventoCompartido = async () => {
      try {
        //Intentar con la lista ya cargada
        const existe = eventos.find((ev) => ev.id === idEvento);
        if (existe) {
          setEventoSeleccionado(existe);
          return;
        }

        // Si no está, traerlo directo desde Firestore
        const eventoRef = doc(db, "eventos", idEvento);
        const eventoSnap = await getDoc(eventoRef);

        if (eventoSnap.exists()) {
          const evento = { id: eventoSnap.id, ...eventoSnap.data() };
          setEventoSeleccionado(evento);
        } else {
          console.warn("No se encontró el evento compartido.");
        }
      } catch (error) {
        console.error("Error al cargar evento compartido:", error);
      }
    };

    // Espera medio segundo si los eventos aún no están cargados
    if (eventos.length === 0) {
      const timer = setTimeout(abrirEventoCompartido, 700);
      return () => clearTimeout(timer);
    } else {
      abrirEventoCompartido();
    }
  }, [eventos]);
// --------------------------------------------------------------------------------------
// Inicio del componente principal del dashboard --------------------------------
  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-semibold mb-6">Explorar Eventos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar evento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white border border-gray-700"
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white border border-gray-700"
        >
          <option value="">Todas las categorías</option>
          <option value="Concierto">Concierto</option>
          <option value="Deporte">Deporte</option>
          <option value="Educativo">Educativo</option>
          <option value="Cultural">Cultural</option>
        </select>

        <select
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white border border-gray-700"
        >
          <option value="">Todos los departamentos</option>
          <option value="Guatemala">Guatemala</option>
          <option value="Sacatepéquez">Sacatepéquez</option>
          <option value="Quetzaltenango">Quetzaltenango</option>
          <option value="Petén">Petén</option>
          <option value="San Marcos">San Marcos</option>
          <option value="Escuintla">Escuintla</option>
        </select>

        <button
          onClick={() => {
            setCategoria("");
            setDepartamento("");
            setBusqueda("");
          }}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Lista de eventos */}
      {cargando ? (
        <p className="text-gray-400 text-center">Cargando eventos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {eventos.length > 0 ? (
            eventos.map((ev) => (
              <EventoCard key={ev.id} evento={ev} onClick={setEventoSeleccionado} />
            ))
          ) : (
            <p className="text-gray-400 col-span-full text-center">
              No se encontraron eventos que coincidan con los filtros.
            </p>
          )}
        </div>
      )}

      {/* Modal */}
      {eventoSeleccionado && (
        <ModalEvento
          evento={eventoSeleccionado}
          onClose={() => {
            setEventoSeleccionado(null);
            //  Borra el parámetro ?evento= de la URL al cerrar
            const url = new URL(window.location);
            url.searchParams.delete("evento");
            window.history.replaceState({}, "", url);
          }}
        />
      )}
    </div>
  );
}
