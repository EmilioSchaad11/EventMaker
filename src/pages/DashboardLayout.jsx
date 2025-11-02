// Imports de Firebase y dependencias necesarias -------------------
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
//------------------------------------------------------------------

// Componente DashboardLayout --------------------------------------
export default function DashboardLayout({ onLogout }) {
  const [apodo, setApodo] = useState("");
// Obtener el apodo del usuario autenticado -------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setApodo(docSnap.data().apodo || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);
// ------------------------------------------------------------------
// Renderizar el layout con Sidebar y Outlet para las rutas hijas ----
  return (
    <div className="flex h-screen">
      <Sidebar onLogout={onLogout} apodo={apodo} />

      {/* Separador  */}
      <div className="w-[2px] bg-gray-800" />

      {/* Contenido principal  */}
      <div className="flex-1 p-6 overflow-auto bg-gray-800 text-gray-100">
        <Outlet />
      </div>
    </div>
  );
}
