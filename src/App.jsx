// Importaciones necesarias para el funcionamiento de la app----------------
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import EventosPage from "./pages/EventosPage";
import ChatLayout from "./pages/ChatLayout";
import PerfilPage from "./pages/PerfilPage";
import EventoPublico from "./pages/EventoPublico";
import ChatEvento from "./pages/ChatEvento";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
//------------------------------------------------------------------------
// Componente principal de la aplicación
function App() {
  const [usuario, setUsuario] = useState(null);
  const [usuarioValido, setUsuarioValido] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //  Escucha del estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          //  Asegurar que el email exista antes de consultar
          const userEmail = user.email ? user.email.toLowerCase() : null;

          //  Solo consultar Firestore si el email está definido
          if (userEmail) {
            const q = query(collection(db, "usuarios"), where("email", "==", userEmail));
            const snapshot = await getDocs(q);

            //  Evita que se dispare el error si las reglas limitan el acceso
            if (!snapshot.empty) {
              setUsuarioValido(true);
            } else {
              console.warn("Usuario no encontrado en la colección 'usuarios'.");
              setUsuarioValido(false);
            }
          } else {
            setUsuarioValido(false);
          }

          setUsuario(user);
        } catch (err) {
          console.error("Error verificando usuario:", err);
          setUsuarioValido(false);
        }
      } else {
        setUsuario(null);
        setUsuarioValido(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-200">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-t-yellow-500 border-gray-700 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-semibold tracking-wide">Cargando...</h1>
        <p className="text-gray-400 text-sm mt-2">Por favor espera un momento</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/*  Evento público */}
        <Route path="/e/:id" element={<EventoPublico />} />

        {/*  Auth */}
        <Route
          path="/login"
          element={usuario && usuarioValido ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={usuario && usuarioValido ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/*  Rutas protegidas */}
        <Route
          element={
            usuario && usuarioValido ? (
              <DashboardLayout onLogout={() => auth.signOut()} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/*  Chat con sidebar */}
          <Route path="/chat" element={<ChatLayout />}>
            <Route
              index
              element={
                <div className="flex items-center justify-center h-full text-gray-500">
                  Selecciona un chat para comenzar
                </div>
              }
            />
            <Route path=":id" element={<ChatEvento />} />
          </Route>
        </Route>

        {/*  Redirección por defecto */}
        <Route
          path="*"
          element={
            usuario && usuarioValido ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
