
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="mt-4 text-3xl font-bold">Page Not Found</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
