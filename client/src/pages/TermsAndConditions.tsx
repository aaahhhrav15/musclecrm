import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  Users, 
  Lock, 
  AlertTriangle,
  Scale,
  Mail,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const TermsAndConditions: React.FC = () => {
  const lastUpdated = "January 1, 2025";

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: <Shield className="w-5 h-5" />,
      content: `By accessing and using MuscleCRM ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. These Terms and Conditions constitute a legally binding agreement between you and MuscleCRM regarding your use of our platform.`
    },
    {
      id: "description",
      title: "2. Service Description",
      icon: <FileText className="w-5 h-5" />,
      content: `MuscleCRM is a comprehensive customer relationship management platform designed specifically for fitness centers, gyms, spas, and wellness businesses. Our service includes member management, scheduling, billing, analytics, and other business management tools. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.`
    },
    {
      id: "eligibility",
      title: "3. User Eligibility",
      icon: <Users className="w-5 h-5" />,
      content: `To use our service, you must be at least 18 years old and have the legal capacity to enter into binding contracts. By using MuscleCRM, you represent and warrant that you meet these eligibility requirements. If you are using the service on behalf of a business or organization, you represent that you have the authority to bind that entity to these terms.`
    },
    {
      id: "accounts",
      title: "4. User Accounts and Security",
      icon: <Lock className="w-5 h-5" />,
      content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate our terms or pose a security risk. You agree to provide accurate and complete information when creating your account.`
    },
    {
      id: "acceptable-use",
      title: "5. Acceptable Use Policy",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: `You agree not to use the service for any unlawful purpose or in any way that could damage, disable, overburden, or impair our servers or networks. Prohibited activities include but are not limited to: uploading malicious code, attempting to gain unauthorized access, violating intellectual property rights, harassing other users, or using the service to send spam or unsolicited communications.`
    },
    {
      id: "privacy",
      title: "6. Privacy and Data Protection",
      icon: <Shield className="w-5 h-5" />,
      content: `We are committed to protecting your privacy and the privacy of your members' data. Our collection, use, and disclosure of personal information is governed by our Privacy Policy, which is incorporated by reference into these terms. You are responsible for obtaining necessary consents from your members for data processing activities conducted through our platform.`
    },
    {
      id: "intellectual-property",
      title: "7. Intellectual Property Rights",
      icon: <FileText className="w-5 h-5" />,
      content: `The MuscleCRM platform, including all software, content, trademarks, and intellectual property, is owned by us or our licensors. You are granted a limited, non-exclusive, non-transferable license to use the service. You retain ownership of any data you input into the system, but grant us a license to process and store such data to provide the service.`
    },
    {
      id: "payment",
      title: "8. Payment Terms and Billing",
      icon: <Calendar className="w-5 h-5" />,
      content: `Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as expressly stated in our refund policy. We reserve the right to change our pricing with 30 days' notice. Failure to pay fees may result in suspension or termination of your account. You are responsible for all taxes associated with your use of the service.`
    },
    {
      id: "termination",
      title: "9. Termination",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: `Either party may terminate this agreement at any time with or without cause. Upon termination, your access to the service will be discontinued, and we may delete your data after a reasonable grace period. Provisions regarding intellectual property, limitation of liability, and indemnification will survive termination of this agreement.`
    },
    {
      id: "disclaimers",
      title: "10. Disclaimers and Warranties",
      icon: <Scale className="w-5 h-5" />,
      content: `The service is provided "as is" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the service will be uninterrupted, error-free, or completely secure.`
    },
    {
      id: "limitation",
      title: "11. Limitation of Liability",
      icon: <Shield className="w-5 h-5" />,
      content: `To the maximum extent permitted by law, our total liability for any claims arising from or related to this agreement shall not exceed the amount paid by you for the service in the 12 months preceding the claim. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or data.`
    },
    {
      id: "indemnification",
      title: "12. Indemnification",
      icon: <Shield className="w-5 h-5" />,
      content: `You agree to indemnify, defend, and hold harmless MuscleCRM and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney fees) arising from your use of the service, violation of these terms, or infringement of any third-party rights.`
    },
    {
      id: "governing-law",
      title: "13. Governing Law and Jurisdiction",
      icon: <Scale className="w-5 h-5" />,
      content: `These terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of [Your Jurisdiction]. If any provision of these terms is found to be unenforceable, the remainder shall continue in full force and effect.`
    },
    {
      id: "changes",
      title: "14. Changes to Terms",
      icon: <FileText className="w-5 h-5" />,
      content: `We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the platform. Your continued use of the service after such modifications constitutes acceptance of the updated terms. We encourage you to review these terms periodically for any changes.`
    },
    {
      id: "contact",
      title: "15. Contact Information",
      icon: <Mail className="w-5 h-5" />,
      content: `If you have any questions about these Terms and Conditions, please contact us at legal@musclecrm.com or through our customer support portal. We are committed to addressing your concerns and ensuring compliance with these terms.`
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container relative z-10 px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2">
                <Scale className="w-4 h-4 mr-2" />
                Legal Information
              </Badge>
              
              <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent sm:text-5xl">
                Terms and Conditions
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-6">
                Please read these terms and conditions carefully before using MuscleCRM. 
                These terms govern your use of our platform and services.
              </p>
              
              <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Last updated: {lastUpdated}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Table of Contents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Table of Contents
                  </h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          {React.cloneElement(section.icon, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" })}
                        </div>
                        <span className="text-sm font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {section.title}
                        </span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Terms Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + (index * 0.05) }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          {React.cloneElement(section.icon, { className: "w-6 h-6 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            {section.title}
                          </h3>
                        </div>
                      </div>
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16"
            >
              <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Questions About These Terms?
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
                    If you have any questions about these Terms and Conditions or need clarification on any points, 
                    our legal team is here to help. We're committed to transparency and ensuring you understand your rights and obligations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="mailto:support@musclecrm.com"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200"
                    >
                      <Mail className="w-4 h-4" />
                      Email Legal Team
                    </a>
                    <a
                      href="/contact"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors duration-200"
                    >
                      Contact Support
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;