import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock,
  ArrowRight,
  Search,
  Filter,
  Tag,
  Eye,
  Heart,
  Share2,
  Dumbbell,
  BarChart3,
  Shield,
  Zap,
  Target,
  Lightbulb,
  DollarSign,
  Smartphone,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const Blogs: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Posts', count: 24, color: 'from-slate-500 to-slate-600' },
    { id: 'business-tips', name: 'Business Tips', count: 8, color: 'from-blue-500 to-blue-600' },
    { id: 'technology', name: 'Technology', count: 6, color: 'from-purple-500 to-purple-600' },
    { id: 'industry-trends', name: 'Industry Trends', count: 5, color: 'from-green-500 to-green-600' },
    { id: 'case-studies', name: 'Case Studies', count: 3, color: 'from-orange-500 to-orange-600' },
    { id: 'product-updates', name: 'Product Updates', count: 2, color: 'from-pink-500 to-pink-600' }
  ];

  const featuredPost = {
    id: 1,
    title: "The Complete Guide to Gym Member Retention in 2025",
    excerpt: "Discover proven strategies and data-driven insights to increase member retention rates, reduce churn, and build a thriving fitness community that keeps members coming back.",
    author: "Sarah Johnson",
    authorRole: "Fitness Industry Expert",
    date: "January 15, 2025",
    readTime: "12 min read",
    category: "business-tips",
    image: "gym-retention-guide",
    views: 2847,
    likes: 156,
    tags: ["retention", "business-growth", "member-experience"],
    featured: true
  };

  const blogPosts = [
    {
      id: 2,
      title: "How AI is Revolutionizing Fitness Business Management",
      excerpt: "Explore how artificial intelligence is transforming gym operations, from predictive analytics to automated member communications.",
      author: "Mike Chen",
      authorRole: "Tech Lead",
      date: "January 12, 2025",
      readTime: "8 min read",
      category: "technology",
      image: "ai-fitness-management",
      views: 1923,
      likes: 89,
      tags: ["AI", "automation", "technology"]
    },
    {
      id: 3,
      title: "10 Essential Metrics Every Gym Owner Should Track",
      excerpt: "Learn which KPIs matter most for your fitness business and how to use data to make informed decisions that drive growth.",
      author: "Emma Rodriguez",
      authorRole: "Business Analyst",
      date: "January 10, 2025",
      readTime: "10 min read",
      category: "business-tips",
      image: "gym-metrics-tracking",
      views: 3156,
      likes: 203,
      tags: ["analytics", "KPIs", "business-intelligence"]
    },
    {
      id: 4,
      title: "The Rise of Boutique Fitness: Market Trends & Opportunities",
      excerpt: "Discover the growing boutique fitness market and how specialized studios are capturing market share with personalized experiences.",
      author: "Alex Thompson",
      authorRole: "Market Research",
      date: "January 8, 2025",
      readTime: "7 min read",
      category: "industry-trends",
      image: "boutique-fitness-trends",
      views: 1745,
      likes: 94,
      tags: ["boutique-fitness", "market-trends", "opportunities"]
    },
    {
      id: 5,
      title: "Case Study: How FitLife Studio Increased Revenue by 45%",
      excerpt: "A detailed look at how one studio transformed their business using MuscleCRM's advanced features and strategic implementation.",
      author: "David Park",
      authorRole: "Customer Success",
      date: "January 5, 2025",
      readTime: "15 min read",
      category: "case-studies",
      image: "fitlife-case-study",
      views: 2234,
      likes: 178,
      tags: ["case-study", "revenue-growth", "success-story"]
    },
    {
      id: 6,
      title: "Building Strong Member Communities in Digital Age",
      excerpt: "Learn how to foster meaningful connections and build loyal member communities using both digital tools and in-person experiences.",
      author: "Lisa Wang",
      authorRole: "Community Expert",
      date: "January 3, 2025",
      readTime: "9 min read",
      category: "business-tips",
      image: "member-communities",
      views: 1867,
      likes: 124,
      tags: ["community", "engagement", "digital-strategy"]
    },
    {
      id: 7,
      title: "New Feature Release: Advanced Analytics Dashboard",
      excerpt: "Introducing our most powerful analytics tools yet, with real-time insights, custom reporting, and predictive analytics capabilities.",
      author: "MuscleCRM Team",
      authorRole: "Product Team",
      date: "December 28, 2024",
      readTime: "5 min read",
      category: "product-updates",
      image: "analytics-dashboard-update",
      views: 1456,
      likes: 87,
      tags: ["product-update", "analytics", "new-features"]
    },
    {
      id: 8,
      title: "Mastering Gym Marketing: Social Media Strategies That Work",
      excerpt: "Effective social media marketing strategies specifically designed for fitness businesses to attract new members and increase engagement.",
      author: "Rachel Green",
      authorRole: "Marketing Specialist",
      date: "December 25, 2024",
      readTime: "11 min read",
      category: "business-tips",
      image: "gym-social-media",
      views: 2891,
      likes: 245,
      tags: ["marketing", "social-media", "member-acquisition"]
    },
    {
      id: 9,
      title: "Data Security in Fitness: Protecting Member Information",
      excerpt: "Essential best practices for safeguarding member data, ensuring GDPR compliance, and building trust through robust security measures.",
      author: "Tom Anderson",
      authorRole: "Security Expert",
      date: "December 22, 2024",
      readTime: "8 min read",
      category: "technology",
      image: "fitness-data-security",
      views: 1678,
      likes: 102,
      tags: ["security", "GDPR", "data-protection"]
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoryId: string) => {
    switch(categoryId) {
      case 'business-tips': return <TrendingUp className="w-4 h-4" />;
      case 'technology': return <Zap className="w-4 h-4" />;
      case 'industry-trends': return <BarChart3 className="w-4 h-4" />;
      case 'case-studies': return <Target className="w-4 h-4" />;
      case 'product-updates': return <Lightbulb className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getImagePlaceholder = (imageId: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600', 
      'from-orange-500 to-red-600',
      'from-purple-500 to-pink-600',
      'from-teal-500 to-cyan-600'
    ];
    const colorIndex = imageId.length % colors.length;
    return colors[colorIndex];
  };

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
                <BookOpen className="w-4 h-4 mr-2" />
                MuscleCRM Blog
              </Badge>
              
              <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent sm:text-5xl lg:text-6xl">
                Insights & Resources for
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Fitness Professionals
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
                Discover expert insights, industry trends, and practical tips to help your fitness business thrive. 
                From business strategies to technology updates, we've got you covered.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search articles, topics, or tags..."
                    className="pl-12 pr-4 py-4 text-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 rounded-xl shadow-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                )}
              >
                {getCategoryIcon(category.id)}
                <span>{category.name}</span>
                <Badge className={cn(
                  "text-xs px-2 py-0.5",
                  selectedCategory === category.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  {category.count}
                </Badge>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
                <Star className="w-4 h-4 mr-2" />
                Featured Article
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Must-Read This Week</h2>
            </div>

            <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border-0 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <div className={`w-full h-80 lg:h-full bg-gradient-to-br ${getImagePlaceholder(featuredPost.image)} flex items-center justify-center`}>
                    <Dumbbell className="w-24 h-24 text-white/30" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm">
                      Featured
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {categories.find(c => c.id === featuredPost.category)?.name}
                    </Badge>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {featuredPost.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {featuredPost.likes}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                    {featuredPost.title}
                  </h3>

                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {featuredPost.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {featuredPost.author}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {featuredPost.authorRole}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-4 h-4" />
                        {featuredPost.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group"
                  >
                    Read Full Article
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Latest Articles
              </h2>
              <div className="text-slate-500 dark:text-slate-400">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                    {/* Image */}
                    <div className="relative overflow-hidden">
                      <div className={`w-full h-48 bg-gradient-to-br ${getImagePlaceholder(post.image)} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                        {getCategoryIcon(post.category) && React.cloneElement(getCategoryIcon(post.category), { className: "w-16 h-16 text-white/30" })}
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm text-xs">
                          {categories.find(c => c.id === post.category)?.name}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-slate-600 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {post.date}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed flex-1">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Author */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900 dark:text-white">
                              {post.author}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {post.authorRole}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-500">
                            <Heart className="w-4 h-4" />
                            <span className="ml-1 text-xs">{post.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-500">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center mt-12"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 group"
              >
                Load More Articles
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Stay Updated
              </Badge>
              
              <h2 className="text-4xl font-bold text-white mb-6 sm:text-5xl">
                Never Miss an Update
              </h2>
              
              <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
                Subscribe to our newsletter and get the latest insights, tips, and industry news 
                delivered directly to your inbox. Join thousands of fitness professionals staying ahead of the curve.
              </p>
              
              <div className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <Input 
                    type="email" 
                    placeholder="Enter your email address"
                    className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 backdrop-blur-sm"
                  />
                  <Button 
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-white/90 px-6 font-semibold"
                  >
                    Subscribe
                  </Button>
                </div>
                <p className="text-sm text-white/70 mt-3">
                  No spam, unsubscribe at any time.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blogs;