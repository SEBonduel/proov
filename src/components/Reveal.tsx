"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Animation d'entrée : fondu + glissement vertical. Déclenchée au montage
// (et non sur défilement) pour garantir que le contenu déjà visible au
// chargement s'affiche toujours, sans page vide avant un scroll.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  // Respecte prefers-reduced-motion : pas d'animation d'entrée si l'utilisateur
  // a demandé à limiter les mouvements (le contenu s'affiche directement).
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
