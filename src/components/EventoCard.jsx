import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function EventoCard({ evento, onClick }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="evento-card cursor-pointer bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-lg overflow-hidden border border-gray-600"
      onClick={() => onClick(evento)}
    >
      {evento.imagen && (
        <img
          src={evento.imagen}
          alt={evento.titulo}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white">{evento.titulo}</h3>
        <p className="text-gray-300 text-sm line-clamp-3">{evento.descripcion}</p>
      </div>
    </motion.div>
  );
}
