import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="bg-mesh pointer-events-none opacity-50 z-0"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel max-w-md w-full p-8 rounded-3xl text-center relative z-10"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">404</h1>
        <p className="text-muted-foreground mb-8">
          The routing layer couldn't find this path. Let's get you back to the main copilot interface.
        </p>
        <Link 
          href="/" 
          className="inline-flex px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
