import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/api";

interface Faculty {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  status: "Upcoming" | "active" | "completed";
  students: any[];
  faculty: {
    name: string;
  }
}

interface Skill {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
}

const mockRecentActivity = [
  {
    action: "created",
    item: "Introduction to Programming batch",
    user: "Admin",
    time: "2 hours ago",
    type: "batch" as const,
  },
  {
    action: "updated",
    item: "Dr. Sarah Johnson's schedule",
    user: "Admin", 
    time: "4 hours ago",
    type: "faculty" as const,
  },
  {
    action: "added",
    item: "Machine Learning skill",
    user: "Admin",
    time: "1 day ago",
    type: "skill" as const,
  },
  {
    action: "completed",
    item: "Summer Mathematics batch",
    user: "System",
    time: "2 days ago",
    type: "batch" as const,
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    label: string;
  };
  color?: string;
}

function StatCard({ title, value, icon: Icon, trend, color = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend.value > 0 ? "text-green-600" : "text-red-600"}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
            {" "}{trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts to manage your institute
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Link to="/faculty">
          <Button variant="outline" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Add New Faculty
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
        <Link to="/batches">
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Create New Batch
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
        <Link to="/skills">
          <Button variant="outline" className="w-full justify-start">
            <BookOpen className="h-4 w-4 mr-2" />
            Manage Skills
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function RecentBatches({ batches }: { batches: Batch[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "Upcoming": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Batches</CardTitle>
          <CardDescription>Latest batch activities and status updates</CardDescription>
        </div>
        <Link to="/batches">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.slice(0, 3).map((batch) => (
            <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{batch.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Faculty: {batch.faculty.name}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <Badge className={getStatusColor(batch.status)}>
                  {batch.status}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {batch.students.length} students
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingSchedule({ batches }: { batches: Batch[] }) {
  const upcomingBatches = batches.filter((batch) => batch.status === "Upcoming");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Schedule</CardTitle>
        <CardDescription>Next scheduled classes and sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingBatches.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.faculty.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{item.status}</div>
                <div className="text-xs text-muted-foreground">{item.students.length} students</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ activities }: { activities: any[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "faculty": return Users;
      case "batch": return Calendar;
      case "skill": return BookOpen;
      default: return Activity;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "created": return "text-green-600";
      case "updated": return "text-blue-600";
      case "added": return "text-green-600";
      case "completed": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest changes and updates in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 ${getActivityColor(activity.action)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className={getActivityColor(activity.action)}>{activity.action}</span>{" "}
                    <span className="font-medium">{activity.item}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const [stats, setStats] = useState({
    totalFaculty: 0,
    activeBatches: 0,
    totalSkills: 0,
    totalStudents: 0,
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [facultyRes, batchesRes, skillsRes, studentsRes, activitiesRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/faculty`),
          fetch(`${API_BASE_URL}/api/batches`),
          fetch(`${API_BASE_URL}/api/skills`),
          fetch(`${API_BASE_URL}/api/students`),
          fetch(`${API_BASE_URL}/api/activities`),
        ]);

      const facultyData = await facultyRes.json();
      const batchesData = await batchesRes.json();
      const skillsData = await skillsRes.json();
      const studentsData = await studentsRes.json();
      const activitiesData = await activitiesRes.json();

      const getStatus = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (now < start) return "Upcoming";
        if (now > end) return "Completed";
        return "Active";
      };

      setStats({
        totalFaculty: facultyData.length,
        activeBatches: batchesData.filter(b => getStatus(b.start_date, b.end_date) === 'Active').length,
        totalSkills: skillsData.length,
        totalStudents: studentsData.length,
      });
      setBatches(batchesData.map(b => ({...b, status: getStatus(b.start_date, b.end_date)})));
      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => {
      window.removeEventListener('focus', fetchData);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome to RVM CAD Management Solution.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculty}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Active Batches"
          value={stats.activeBatches}
          icon={Calendar}
          color="text-green-600"
        />
        <StatCard
          title="Total Skills"
          value={stats.totalSkills}
          icon={BookOpen}
          color="text-purple-600"
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={TrendingUp}
          color="text-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <RecentBatches batches={batches} />
          
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Upcoming Schedule</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="schedule">
              <UpcomingSchedule batches={batches} />
            </TabsContent>
            <TabsContent value="activity">
              <RecentActivity activities={activities} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">System Online</span>
                </div>
                <Badge variant="outline" className="text-green-600">
                  Healthy
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Faculty Utilization</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Batch Capacity</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Last updated: 5 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}