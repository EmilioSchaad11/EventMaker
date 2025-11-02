//Imports de firebase, emailjs y otras dependencias ---------------------------------------
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import {doc, setDoc, collection, query, where, getDocs, serverTimestamp,} from "firebase/firestore";
//eslit-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
// --------------------------------------------------------------------------------------
// Funcion Componente Register ------------------------------------------------------
export default function Register() {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    apodo: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
     //Esta funcion verifica que el apodo no este en uso ------------------------------
      const q = query(
        collection(db, "usuarios"),
        where("apodo", "==", form.apodo)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setError("El apodo ya está en uso, elige otro.");
        setLoading(false);
        return;
      }
      // Se crea el usuario en Firebase Auth por correo y contraseña ------------------------------
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // Se guarda el usuario en Firestore como un nuevo documento ------------------------------
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombres: form.nombres,
        apellidos: form.apellidos,
        apodo: form.apodo,
        email: form.email.toLowerCase(),
        creadoEn: serverTimestamp(),
      });

      console.log("Documento de usuario creado en Firestore");

      //Por medio de EmailJS se envía un correo de confirmación al nuevo usuario ------------------------------
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE,
        "template_gmxfkdb",
        {
          name: `${form.nombres} ${form.apellidos}`,
          email: form.email,
          apodo: form.apodo,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC
      );

      console.log(" Correo de confirmación enviado con éxito.");
      navigate("/dashboard");
    } catch (err) {
      console.error(" Error al registrar usuario:", err);
      setError("Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };
 // Inicio del componente principal el cual es la interfaz de REGISTER--------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/70 border border-gray-700 rounded-2xl shadow-2xl p-8 backdrop-blur-lg"
      >
        <h1 className="text-3xl font-bold text-center mb-6">Crear Cuenta</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Componente Nombres */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombres</label>
            <input
              type="text"
              name="nombres"
              value={form.nombres ?? ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Componente Apellidos */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Apellidos</label>
            <input
              type="text"
              name="apellidos"
              value={form.apellidos ?? ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Componente apodo */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Apodo</label>
            <input
              type="text"
              name="apodo"
              value={form.apodo ?? ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={form.email ?? ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Componente Contraseña */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password ?? ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-yellow-500 text-black font-semibold rounded-xl hover:brightness-110 transition"
          >
            {loading ? "Creando..." : "Crear Cuenta"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="text-yellow-400 hover:text-yellow-300">
            Inicia sesión aquí
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
