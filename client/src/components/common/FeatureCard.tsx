
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'rounded-lg border p-6',
        'bg-background shadow-sm'
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
