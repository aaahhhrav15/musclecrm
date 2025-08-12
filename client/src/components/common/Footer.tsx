import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram,
  ArrowRight,
  Building2,
  Users,
  BarChart3,
  CreditCard,
  Calendar,
  MessageCircle,
  Shield,
  Zap,
  CheckCircle2,
  Dumbbell
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="container px-6 pt-12 mx-auto">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                  MuscleCRM
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-md">
                The most comprehensive CRM platform designed specifically for fitness businesses. 
                Transform your gym operations with powerful analytics and automation.
              </p>
              


              {/* Social Links */}
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 group">
                  <Twitter className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 group">
                  <Linkedin className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 group">
                  <Facebook className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 group">
                  <Instagram className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-pink-500 transition-colors" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Product
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/about" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    About MuscleCRM
                  </Link>
                </li>
                <li>
                  <Link to="/subscriptions" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link to="/blogs" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Blog & Updates
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Schedule Demo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Support
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/industries/gym" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Gym Features
                  </Link>
                </li>
                <li>
                  <Link to="/subscriptions" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>


        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <div className="container px-6 py-8 mx-auto">
          <div className="flex justify-center items-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              &copy; {currentYear} MeeraAI Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
