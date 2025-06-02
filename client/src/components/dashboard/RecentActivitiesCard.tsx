import React from 'react';
import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
}

interface RecentActivitiesCardProps {
  activities: Activity[];
}

const RecentActivitiesCard: React.FC<RecentActivitiesCardProps> = ({ activities }) => {
  return (
    <div className="p-6 border rounded-lg">
      <h2 className="mb-4 text-xl font-semibold">Recent Activities</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{activity.title}</h3>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
              activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {activity.status}
            </span>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-center text-muted-foreground">No recent activities</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivitiesCard;
