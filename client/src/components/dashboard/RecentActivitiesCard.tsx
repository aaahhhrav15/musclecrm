
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Activity {
  id: string;
  title: string;
  time: string;
  description: string;
  type: 'booking' | 'customer' | 'invoice' | 'message';
}

interface RecentActivitiesCardProps {
  activities?: Activity[];
}

// Mock data for recent activities
const defaultActivities: Activity[] = [
  {
    id: '1',
    title: 'New booking',
    time: '10 minutes ago',
    description: 'John Doe booked a session for tomorrow at 2:00 PM',
    type: 'booking'
  },
  {
    id: '2',
    title: 'Invoice paid',
    time: '2 hours ago',
    description: 'Jane Smith paid invoice #1234 for $150',
    type: 'invoice'
  },
  {
    id: '3',
    title: 'New customer',
    time: '3 hours ago',
    description: 'Michael Johnson signed up as a new customer',
    type: 'customer'
  },
  {
    id: '4',
    title: 'Message received',
    time: '5 hours ago',
    description: 'Sarah Williams sent a message about her appointment',
    type: 'message'
  },
  {
    id: '5',
    title: 'Booking canceled',
    time: 'Yesterday',
    description: 'Robert Brown canceled his appointment for today',
    type: 'booking'
  }
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'booking':
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">📅</div>;
    case 'customer':
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">👤</div>;
    case 'invoice':
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600">💰</div>;
    case 'message':
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600">💬</div>;
    default:
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">📌</div>;
  }
};

const RecentActivitiesCard: React.FC<RecentActivitiesCardProps> = ({ activities = defaultActivities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>The latest activities in your CRM</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              {getActivityIcon(activity.type)}
              <div className="flex-1 ml-4">
                <div className="flex justify-between">
                  <p className="font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 text-center">
          <button className="text-sm font-medium text-primary hover:underline">
            View all activities
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivitiesCard;
