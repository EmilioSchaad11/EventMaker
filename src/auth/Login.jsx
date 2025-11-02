//Imports de firebase y otras dependencias ---------------------------------------
import React, { useState } from "react";
import { signInWithEmailAndPassword,signInWithPopup, GoogleAuthProvider, signOut, deleteUser,} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
//eslit-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
// --------------------------------------------------------------------------------------
// Componente Login -------------------------------------------------------------------
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();
// --------------------------------------------------------------------------------------
//Login con proveedor de firebase ---------------------------------------
const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };
// --------------------------------------------------------------------------------------
  
// Login con Google y verificación en Firestore que no exista el usuario------------------------------ 
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const correoNormalizado = user.email.trim().toLowerCase();

      console.log("Usuario de Google:", correoNormalizado);

      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", correoNormalizado));
      const querySnapshot = await getDocs(q);

      console.log("Documentos encontrados:", querySnapshot.size);

      if (querySnapshot.empty) {
        console.log(" No se encontró usuario en Firestore");
        setTempUser(user);
        setShowCreatePrompt(true);
        setLoading(false);
        return;
      }

      console.log(" Usuario encontrado en Firestore, acceso permitido");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al iniciar sesión con Google:", err);
      setError("Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };
  // --------------------------------------------------------------------------------------

  // Se elimina el usuario temporal si no se registra ------------------------------
  const limpiarUsuarioTemporal = async () => {
    if (tempUser) {
      try {
        await deleteUser(tempUser).catch(() => {});
      } catch (err) {
        console.warn("No se pudo eliminar el usuario temporal:", err);
      }
    }
    await signOut(auth);
    setTempUser(null);
  };

  const closePrompt = async () => {
    setShowCreatePrompt(false);
    await limpiarUsuarioTemporal();
  };

  const goToRegister = async () => {
    await limpiarUsuarioTemporal();
    navigate("/register");
  };
// --------------------------------------------------------------------------------------

//Inicio del componente principal el cual es la interfaz de LOGIN--------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/70 border border-gray-700 rounded-2xl shadow-2xl p-8 backdrop-blur-lg"
      >
        <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white text-gray-800 font-semibold rounded-xl shadow hover:bg-gray-100 transition"
        >
          <FcGoogle size={22} /> Iniciar sesión con Google
        </button>

        <p className="text-center text-gray-400 mt-6 text-sm">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="text-yellow-400 hover:text-yellow-300">
            Regístrate aquí
          </Link>
        </p>
      </motion.div>

      <AnimatePresence>
        {showCreatePrompt && (
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
                Cuenta no registrada
              </h2>
              <p className="text-gray-400 mb-6">
                Tu cuenta de Google aún no está registrada en el sistema.
                Crea una cuenta antes de iniciar sesión.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={goToRegister}
                  className="px-4 py-2 bg-yellow-500 hover:brightness-110 rounded-xl font-semibold text-black"
                >
                  Crear cuenta
                </button>
                <button
                  onClick={closePrompt}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-white"
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
