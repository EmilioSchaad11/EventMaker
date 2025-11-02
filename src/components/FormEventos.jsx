import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function FormEvento({ onEventoAgregado, eventoEditando, onEditCancel }) {
  const eventoGuardado =
    JSON.parse(localStorage.getItem("eventoTemporal")) || {
      titulo: "",
      descripcion: "",
      fecha: "",
      hora: "",
      departamento: "",
      municipio: "",
      lugar: "",
      categoria: "",
      tipo: "Presencial",
      cupo: "",
    };

  const [evento, setEvento] = useState(eventoEditando || eventoGuardado);
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [visible, setVisible] = useState(false);
  const [modal, setModal] = useState({ visible: false, tipo: "", accion: null });

  // 👥 Colaboradores
  const [apodosInput, setApodosInput] = useState("");
  const [colaboradores, setColaboradores] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const departamentos = {
    Guatemala: ["Guatemala", "Mixco", "Villa Nueva", "San Miguel Petapa", "Santa Catarina Pinula"],
    Sacatepéquez: ["Antigua Guatemala", "Jocotenango", "Ciudad Vieja"],
    Escuintla: ["Escuintla", "Santa Lucía Cotzumalguapa", "La Democracia"],
    Quetzaltenango: ["Quetzaltenango", "Salcajá", "San Carlos Sija"],
    Peten: ["Flores", "San Benito", "San Andrés"],
    "San Marcos": ["San Marcos", "Malacatán", "San Pedro Sacatepéquez"],
  };

  useEffect(() => {
    if (eventoEditando) {
      setEvento(eventoEditando);

      // 🔹 Cargar colaboradores del evento al editar
      const cargarColaboradores = async () => {
        const q = query(collection(db, "invitaciones"), where("eventoId", "==", eventoEditando.id));
        const snap = await getDocs(q);
        const lista = snap.docs.map((d) => ({
          apodo: d.data().apodoColaborador,
          estado: d.data().estado,
        }));
        setColaboradores(lista);
      };
      cargarColaboradores();
    }
  }, [eventoEditando]);

  useEffect(() => {
    localStorage.setItem("eventoTemporal", JSON.stringify(evento));
  }, [evento]);

  const handleChange = (e) => setEvento({ ...evento, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImagen(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setVisible(true);
    setTimeout(() => setVisible(false), 4000);
  };

  const abrirModal = (tipo, accion) => setModal({ visible: true, tipo, accion });
  const cerrarModal = () => setModal({ visible: false, tipo: "", accion: null });

  const handleSubmit = async (e) => {
  e.preventDefault();
  abrirModal(eventoEditando ? "actualizar" : "crear", async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        mostrarMensaje("Debes iniciar sesión para crear o editar eventos.", "warning");
        setLoading(false);
        return;
      }

      // Validar fecha del evento
      const fechaEvento = new Date(evento.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaEvento <= hoy) {
        mostrarMensaje("No puedes crear eventos para hoy ni fechas anteriores", "warning");
        setLoading(false);
        return;
      }

      // Validar imagen
      if (!imagen && !evento.imagen) {
        mostrarMensaje("Debes seleccionar una imagen para el evento", "warning");
        setLoading(false);
        return;
      }

      // Subir imagen si hay una nueva
      let imageUrl = evento.imagen || "";
      if (imagen) {
        const formData = new FormData();
        formData.append("file", imagen);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      // Limpiar datos undefined o vacíos
      const datosFiltrados = Object.fromEntries(
        Object.entries({
          ...evento,
          imagen: imageUrl,
          creadorId: user.uid,
          creadorNombre: user.displayName || user.email,
          fecha_creacion: serverTimestamp(),
        }).filter(([_, v]) => v !== undefined)
      );

      if (eventoEditando?.id) {
        // ✅ Actualización de evento existente
        const eventoRef = doc(db, "eventos", eventoEditando.id);
        const snapshot = await getDoc(eventoRef);
        if (!snapshot.exists()) {
          mostrarMensaje("El evento no existe o fue eliminado", "warning");
          setLoading(false);
          return;
        }

        await updateDoc(eventoRef, datosFiltrados);

        onEventoAgregado({ id: eventoEditando.id, ...datosFiltrados });
        mostrarMensaje("Evento actualizado correctamente.", "success");
      } else {
        // ✅ Creación de nuevo evento
        const docRef = await addDoc(collection(db, "eventos"), datosFiltrados);
        onEventoAgregado({ id: docRef.id, ...datosFiltrados });
        mostrarMensaje("Evento creado correctamente", "success");
      }

      // Limpiar formulario tras guardar
      setEvento({
        titulo: "",
        descripcion: "",
        fecha: "",
        hora: "",
        departamento: "",
        municipio: "",
        lugar: "",
        categoria: "",
        tipo: "Presencial",
        cupo: "",
      });
      setImagen(null);
      setPreview(null);
      localStorage.removeItem("eventoTemporal");
      onEditCancel && onEditCancel();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      mostrarMensaje("Error al guardar el evento. Intenta nuevamente.", "error");
    } finally {
      setLoading(false);
      cerrarModal();
    }
  });
};


  // 🔹 Enviar invitaciones a colaboradores (múltiples apodos)
  const enviarInvitaciones = async () => {
    if (!apodosInput.trim()) return mostrarMensaje("Debes ingresar al menos un apodo.", "warning");

    const user = auth.currentUser;
    if (!user || !eventoEditando?.id)
      return mostrarMensaje("Debes estar autenticado.", "error");

    const apodos = apodosInput
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (apodos.length === 0) return mostrarMensaje("Formato incorrecto.", "warning");

    try {
      setEnviando(true);

      for (const apodo of apodos) {
        const q = query(collection(db, "usuarios"), where("apodo", "==", apodo));
        const snap = await getDocs(q);

        if (snap.empty) {
          mostrarMensaje(`No se encontró: ${apodo}`, "warning");
          continue;
        }

        const colaborador = snap.docs[0].data();
        if (colaborador.uid === user.uid) continue;

        const yaExiste = colaboradores.some((c) => c.apodo === colaborador.apodo);
        if (yaExiste) continue;

        await addDoc(collection(db, "invitaciones"), {
          deUid: user.uid,
          paraUid: colaborador.uid,
          apodoColaborador: colaborador.apodo,
          eventoId: eventoEditando.id,
          eventoTitulo: evento.titulo,
          estado: "pendiente",
          fecha: serverTimestamp(),
        });

        setColaboradores((prev) => [
          ...prev,
          { apodo: colaborador.apodo, estado: "pendiente" },
        ]);
      }

      mostrarMensaje("Invitaciones enviadas correctamente ✅", "success");
      setApodosInput("");
    } catch (err) {
      console.error(err);
      mostrarMensaje("Error al enviar invitaciones.", "error");
    } finally {
      setEnviando(false);
    }
  };

  const limpiarFormulario = () => {
    abrirModal("limpiar", () => {
      setEvento({
        titulo: "",
        descripcion: "",
        fecha: "",
        hora: "",
        departamento: "",
        municipio: "",
        lugar: "",
        categoria: "",
        tipo: "Presencial",
        cupo: "",
      });
      setImagen(null);
      setPreview(null);
      localStorage.removeItem("eventoTemporal");
      cerrarModal();
    });
  };

  const colores = {
    success: "border-green-400 text-green-300 bg-green-900/20",
    error: "border-red-400 text-red-300 bg-red-900/20",
    warning: "border-yellow-400 text-yellow-300 bg-yellow-900/20",
    info: "border-blue-400 text-blue-300 bg-blue-900/20",
  };

  return (
    <>
      {/* Modal de confirmación */}
      <AnimatePresence>
        {modal.visible && (
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
              className="bg-gray-800 rounded-2xl p-6 text-center shadow-2xl border border-gray-600 max-w-sm w-full"
            >
              <h3 className="text-xl text-gray-100 mb-2 font-semibold">
                {modal.tipo === "crear" && "¿Confirmar creación del evento?"}
                {modal.tipo === "actualizar" && "¿Confirmar actualización del evento?"}
                {modal.tipo === "limpiar" && "¿Seguro que deseas limpiar el formulario?"}
              </h3>
              <p className="text-gray-400 mb-4">
                {modal.tipo === "limpiar"
                  ? "Se borrarán los datos ingresados"
                  : "Revisa que los datos sean correctos antes de continuar"}
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => modal.accion()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_12px_rgba(168,85,247,0.6)] text-white px-4 py-2 rounded-lg transition"
                >
                  Confirmar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cerrarModal}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario principal */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-2xl shadow-lg space-y-6 border border-gray-700 max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-center text-gray-100">
          {eventoEditando ? "Editar Evento" : "Crear Evento"}
        </h2>

        {/* Mensaje de estado */}
        <AnimatePresence>
          {visible && (
            <motion.div
              key="mensaje"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className={`border-l-4 px-4 py-3 rounded-lg text-center ${colores[tipoMensaje]}`}
            >
              {mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="titulo"
            placeholder="Título del evento"
            value={evento.titulo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />
          <input
            type="text"
            name="categoria"
            placeholder="Categoría"
            value={evento.categoria}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        <textarea
          name="descripcion"
          placeholder="Descripción del evento"
          value={evento.descripcion}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="fecha"
            value={evento.fecha}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />
          <input
            type="time"
            name="hora"
            value={evento.hora}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <select
            name="departamento"
            value={evento.departamento}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="">Departamento</option>
            {Object.keys(departamentos).map((dep) => (
              <option key={dep}>{dep}</option>
            ))}
          </select>

          <select
            name="municipio"
            value={evento.municipio}
            onChange={handleChange}
            required
            disabled={!evento.departamento}
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="">Municipio</option>
            {evento.departamento &&
              departamentos[evento.departamento]?.map((mun) => (
                <option key={mun}>{mun}</option>
              ))}
          </select>

          <input
            type="text"
            name="lugar"
            placeholder="Lugar exacto"
            value={evento.lugar}
            onChange={handleChange}
            required
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select
            name="tipo"
            value={evento.tipo}
            onChange={handleChange}
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          >
            <option>Presencial</option>
            <option>Virtual</option>
          </select>
          <input
            type="number"
            name="cupo"
            placeholder="Cupo (opcional)"
            value={evento.cupo}
            onChange={handleChange}
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {/* 🖼 Imagen + separador */}
        <div className="space-y-3 pt-4 border-t border-gray-700 mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-gray-300 cursor-pointer"
          />
          {preview && (
            <motion.img
              src={preview}
              alt="Vista previa"
              className="w-full h-56 object-cover rounded-xl border border-gray-700 shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>

        {/* 👥 Sección de colaboradores */}
        {eventoEditando && (
          <div className="border-t border-gray-700 pt-5 mt-5">
            <h3 className="text-xl font-semibold text-white mb-3">
              👥 Editar Colaboradores
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Agrega apodos separados por comas (ejemplo: juan23, mariax, pedro_dev)
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={apodosInput}
                onChange={(e) => setApodosInput(e.target.value)}
                placeholder="Apodos..."
                className="flex-1 px-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition"
              />
              <button
                onClick={enviarInvitaciones}
                disabled={enviando}
                type="button"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_12px_rgba(168,85,247,0.6)] text-white px-4 py-2 rounded-xl transition font-semibold"
              >
                {enviando ? "Enviando..." : "Agregar"}
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h4 className="text-gray-300 font-medium mb-2">Colaboradores actuales:</h4>
              {colaboradores.length > 0 ? (
                <ul className="space-y-2 text-gray-400 text-sm">
                  {colaboradores.map((col, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center border-b border-gray-800 pb-1"
                    >
                      <span>@{col.apodo}</span>
                      <span
                        className={`text-xs ${
                          col.estado === "aceptada"
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {col.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm italic">Sin colaboradores aún.</p>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-between mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_12px_rgba(168,85,247,0.6)] text-white px-6 py-2 rounded-xl transition font-semibold"
          >
            {loading ? "Guardando..." : eventoEditando ? "Actualizar" : "Crear"}
          </button>
          <button
            type="button"
            onClick={limpiarFormulario}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition font-semibold"
          >
            Limpiar
          </button>
        </div>
      </form>
    </>
  );
}
