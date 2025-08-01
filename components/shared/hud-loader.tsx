"use client"

import { motion } from "framer-motion"

interface HudLoaderProps {
  message?: string
}

export function HudLoader({ message = "Initializing Panel Command Matrix..." }: HudLoaderProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="hud-scanlines absolute inset-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center space-y-6"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-24 h-24 border-4 border-hud-primary/30 border-t-hud-primary rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="absolute inset-2 w-16 h-16 border-2 border-hud-secondary/30 border-b-hud-secondary rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-2"
        >
          <div className="text-hud-primary font-mono text-lg font-bold uppercase tracking-widest">XTV Neural Grid</div>
          <div className="text-hud-secondary font-mono text-sm animate-pulse">{message}</div>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "200px" }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="h-1 bg-gradient-to-r from-hud-primary to-hud-secondary rounded-full"
        />
      </motion.div>
    </div>
  )
}
