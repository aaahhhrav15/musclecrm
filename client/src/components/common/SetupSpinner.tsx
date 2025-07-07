
import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

interface SetupSpinnerProps {
  message: string;
}

const SetupSpinner: React.FC<SetupSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="mb-6 text-primary"
        >
          <Loader size={48} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-2 text-2xl font-semibold"
        >
          Setting up your MuscleCRM
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-muted-foreground"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SetupSpinner;
