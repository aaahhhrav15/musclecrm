
import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  buttonLink: string;
  highlighted?: boolean;
  delay?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  description,
  features,
  buttonText,
  buttonLink,
  highlighted = false,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'flex flex-col h-full p-6 rounded-lg border shadow-sm',
        highlighted && 'border-primary shadow-md relative'
      )}
    >
      {highlighted && (
        <div className="absolute px-3 py-1 text-xs font-medium text-white rounded-full -top-3 bg-primary left-1/2 -translate-x-1/2">
          Most Popular
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-3">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      
      <ul className="flex-1 mb-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckIcon
              className={cn(
                'w-5 h-5 mr-2 flex-shrink-0',
                feature.included ? 'text-primary' : 'text-gray-300'
              )}
            />
            <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
      
      <Button 
        asChild 
        variant={highlighted ? 'default' : 'outline'}
        className="w-full mt-auto"
      >
        <a href={buttonLink}>{buttonText}</a>
      </Button>
    </motion.div>
  );
};

export default PricingCard;
