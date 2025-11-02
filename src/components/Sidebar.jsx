import React from "react";
import { NavLink } from "react-router-dom";
import { FaUser, FaCalendarAlt, FaComments, FaHome, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar({ onLogout, apodo }) {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col p-6 shadow-lg">
      {/* Encabezado */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">EventMaker</h1>
        {apodo && <p className="text-gray-400 mt-1 text-sm">Sesión: {apodo}</p>}
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-3 flex-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition ${isActive ? "bg-gray-800" : ""}`
          }
        >
          <FaHome /> Dashboard
        </NavLink>

        <NavLink
          to="/eventos"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition ${isActive ? "bg-gray-800" : ""}`
          }
        >
          <FaCalendarAlt /> Eventos
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition ${isActive ? "bg-gray-800" : ""}`
          }
        >
          <FaComments /> Chats
        </NavLink>

        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition ${isActive ? "bg-gray-800" : ""}`
          }
        >
          <FaUser /> Perfil
        </NavLink>
      </nav>

      {/* Cerrar sesión */}
      <button
        onClick={onLogout}
        className="mt-6 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500 font-semibold transition"
      >
        <FaSignOutAlt /> Cerrar sesión
      </button>
    </div>
  );
}
