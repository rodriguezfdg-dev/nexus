'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function PageTransition({ 
  children,
  isBackNav = false
}: { 
  children: React.ReactNode
  isBackNav?: boolean
}) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={!isBackNav}>
      <motion.div
        key={pathname}
        initial={isBackNav ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
