"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Animation d'entrée : fondu + glissement vertical. Déclenchée au montage
// (et non sur défilement) pour garantir que le contenu déjà visible au
// chargement s'affiche toujours — sans page qui paraît vide avant un scroll.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
