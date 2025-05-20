
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndustryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

const IndustryCard: React.FC<IndustryCardProps> = ({ title, description, icon, color, path }) => {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-lg border shadow-sm transition-all',
        'hover:shadow-md group'
      )}
    >
      <Link to={path} className="block h-full">
        <div className="p-6">
          <div className={cn(
            'flex items-center justify-center w-12 h-12 mb-4 rounded-full',
            `bg-${color}`
          )}>
            {icon}
          </div>
          <h3 className="mb-2 text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
          
          <div className="flex items-center mt-4 text-sm font-medium text-primary">
            <span>Learn more</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default IndustryCard;
