import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
  FileText,
  Users,
  LogIn,
  LogOutIcon,
  Bell,
  MessageSquare,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface StudentDashboardProps {
  accessToken: string;
  user: any;
  onLogout: () => void;
}

export function StudentDashboard({ accessToken, user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
    fetchLeaveBalance();
    fetchManager();
    fetchNotices();
    fetchComplaints();
    fetchTeachers();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/my-attendance`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAttendanceHistory(data.records);
        
        // Find today's attendance
        const today = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const todayRecord = data.records.find((r: any) => r.date === today);
        setTodayAttendance(todayRecord);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/my-leaves`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setLeaves(data.leaves);
      }
    } catch (error) {
      console.error('Fetch leaves error:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/leave-balance`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setLeaveBalance(data.balance);
      }
    } catch (error) {
      console.error('Fetch leave balance error:', error);
    }
  };

  const fetchManager = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/my-manager`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setManager(data.manager);
      }
    } catch (error) {
      console.error('Fetch manager error:', error);
    }
  };

  const fetchNotices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/my-notices`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error('Fetch notices error:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/my-complaints`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error('Fetch complaints error:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/my-teachers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Fetch teachers error:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/check-in`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Checked in successfully!');
        setTodayAttendance(data.record);
        fetchAttendance();
      } else {
        toast.error(data.error || 'Failed to check in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/check-out`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Checked out successfully!');
        setTodayAttendance(data.record);
        fetchAttendance();
      } else {
        toast.error(data.error || 'Failed to check out');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleApplyLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as string;
    const fromDate = formData.get('fromDate') as string;
    const toDate = formData.get('toDate') as string;
    const reason = formData.get('reason') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/apply-leave`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, fromDate, toDate, reason }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Leave application submitted!');
        setLeaveDialogOpen(false);
        fetchLeaves();
      } else {
        toast.error(data.error || 'Failed to apply for leave');
      }
    } catch (error) {
      console.error('Apply leave error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-500';
      case 'Absent':
        return 'bg-red-500';
      case 'Late':
        return 'bg-yellow-500';
      case 'Leave':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleReactToNotice = async (noticeId: string, reaction: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/react-to-notice`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ noticeId, reaction }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Reaction added!');
        fetchNotices();
      }
    } catch (error) {
      console.error('React to notice error:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/submit-complaint`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subject, description, attachments: [] }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Complaint submitted successfully!');
        setComplaintDialogOpen(false);
        fetchComplaints();
      } else {
        toast.error(data.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Submit complaint error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const getComplaintStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'Under Review':
        return <Badge className="bg-blue-500">Under Review</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl text-gray-900">Student Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Student ID: {user.studentId}</p>
                <p className="text-sm text-gray-500">{user.semester}</p>
              </div>
              <Button onClick={onLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="noticeboard">Notices</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Check In/Out Card */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Mark your check-in and check-out</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <Button
                      onClick={handleCheckIn}
                      disabled={loading || (todayAttendance && todayAttendance.checkIn)}
                      className="w-full"
                      size="lg"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Check In
                    </Button>
                    {todayAttendance?.checkIn && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Check-in time</p>
                        <p className="text-green-600">{todayAttendance.checkIn}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleCheckOut}
                      disabled={loading || !todayAttendance?.checkIn || todayAttendance?.checkOut}
                      className="w-full"
                      size="lg"
                      variant="secondary"
                    >
                      <LogOutIcon className="w-5 h-5 mr-2" />
                      Check Out
                    </Button>
                    {todayAttendance?.checkOut && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Check-out time</p>
                        <p className="text-blue-600">{todayAttendance.checkOut}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4">
                    <Clock className="w-12 h-12 text-indigo-600 mb-2" />
                    <p className="text-sm text-gray-500">Total Duration</p>
                    <p className="text-2xl text-indigo-600">
                      {todayAttendance?.duration || '0h 0m'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Total Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <p className="text-3xl">
                      {attendanceHistory.filter((r) => r.status === 'Present').length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Total Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <p className="text-3xl">
                      {attendanceHistory.filter((r) => r.status === 'Absent').length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-8 h-8 text-blue-500" />
                    <p className="text-3xl">
                      {attendanceHistory.length > 0
                        ? Math.round(
                            (attendanceHistory.filter((r) => r.status === 'Present').length /
                              attendanceHistory.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceHistory.slice(0, 5).map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(record.status)}`} />
                        <div>
                          <p className="text-sm">{record.date}</p>
                          <p className="text-xs text-gray-500">{record.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {record.checkIn} - {record.checkOut || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{record.duration || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {attendanceHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No attendance records yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Attendance History</CardTitle>
                <CardDescription>Complete record of your attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Check-In</th>
                        <th className="text-left py-3 px-4">Check-Out</th>
                        <th className="text-left py-3 px-4">Duration</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((record, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{record.date}</td>
                          <td className="py-3 px-4">{record.checkIn || 'N/A'}</td>
                          <td className="py-3 px-4">{record.checkOut || 'N/A'}</td>
                          <td className="py-3 px-4">{record.duration || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {attendanceHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No attendance records found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Calendar</CardTitle>
                <CardDescription>Visual overview of your monthly attendance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
                <div className="mt-6 w-full max-w-md space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <span className="text-sm">Late</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <span className="text-sm">Leave</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaves Tab */}
          <TabsContent value="leaves" className="space-y-6">
            {/* Apply Leave */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leave Applications</CardTitle>
                    <CardDescription>Apply for leave and track applications</CardDescription>
                  </div>
                  <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <FileText className="w-4 h-4 mr-2" />
                        Apply for Leave
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for Leave</DialogTitle>
                        <DialogDescription>Fill in the details to submit your leave application</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleApplyLeave} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="leave-type">Leave Type</Label>
                          <Select name="type" required>
                            <SelectTrigger id="leave-type">
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CL">Casual Leave (CL)</SelectItem>
                              <SelectItem value="SL">Sick Leave (SL)</SelectItem>
                              <SelectItem value="EL">Earn Leave (EL)</SelectItem>
                              <SelectItem value="LWP">Leave Without Pay (LWP)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="from-date">From Date</Label>
                          <Input id="from-date" name="fromDate" type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="to-date">To Date</Label>
                          <Input id="to-date" name="toDate" type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            id="reason"
                            name="reason"
                            placeholder="Enter reason for leave"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaves.map((leave, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm">{leave.type}</p>
                        <p className="text-xs text-gray-500">
                          {leave.fromDate} to {leave.toDate}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{leave.reason}</p>
                      </div>
                      <div className="text-right">
                        {getLeaveStatusBadge(leave.status)}
                        <p className="text-xs text-gray-500 mt-1">Applied: {leave.appliedOn}</p>
                      </div>
                    </div>
                  ))}
                  {leaves.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No leave applications yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leave Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
                <CardDescription>Your current leave balance</CardDescription>
              </CardHeader>
              <CardContent>
                {leaveBalance && (
                  <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(leaveBalance).map(([type, data]: [string, any]) => (
                      <div key={type} className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">{type}</p>
                        <p className="text-2xl mt-1">
                          {data.total === -1 ? '∞' : data.total - data.taken}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Taken: {data.taken} / {data.total === -1 ? '∞' : data.total}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Noticeboard Tab */}
          <TabsContent value="noticeboard" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-indigo-600" />
                  <div>
                    <CardTitle>Noticeboard</CardTitle>
                    <CardDescription>Official notices and announcements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notices.map((notice, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg">{notice.title}</h3>
                          <p className="text-xs text-gray-500">
                            Posted by {notice.postedBy} on {notice.postedOn}
                          </p>
                        </div>
                        <Badge>{notice.targetAudience}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{notice.content}</p>
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactToNotice(notice.id, 'Like')}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Like
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactToNotice(notice.id, 'Dislike')}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Dislike
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactToNotice(notice.id, 'Understood')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Understood
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactToNotice(notice.id, 'Concerned')}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Concerned
                        </Button>
                      </div>
                      {notice.reactions && Object.keys(notice.reactions).length > 0 && (
                        <div className="mt-3 text-xs text-gray-500">
                          {Object.keys(notice.reactions).length} reaction(s)
                        </div>
                      )}
                    </div>
                  ))}
                  {notices.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No notices available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                    <div>
                      <CardTitle>My Complaints</CardTitle>
                      <CardDescription>Submit and track your complaints</CardDescription>
                    </div>
                  </div>
                  <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Complaint
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Complaint</DialogTitle>
                        <DialogDescription>
                          Describe your issue and we'll get back to you
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitComplaint} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="complaint-subject">Subject</Label>
                          <Input
                            id="complaint-subject"
                            name="subject"
                            placeholder="Brief description of your complaint"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complaint-description">Description</Label>
                          <Textarea
                            id="complaint-description"
                            name="description"
                            placeholder="Provide detailed information about your complaint"
                            rows={5}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Submitting...' : 'Submit Complaint'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complaints.map((complaint, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm">{complaint.subject}</h3>
                          <p className="text-xs text-gray-500">Submitted on {complaint.submittedOn}</p>
                        </div>
                        {getComplaintStatusBadge(complaint.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{complaint.description}</p>
                      {complaint.response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-700">
                            <strong>Admin Response:</strong> {complaint.response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {complaints.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No complaints submitted yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  <div>
                    <CardTitle>My Teachers</CardTitle>
                    <CardDescription>Teachers assigned to your semester</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {teachers.map((teacher, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-indigo-600 text-white">
                            {teacher.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-lg">{teacher.name}</p>
                          <p className="text-sm text-gray-600">{teacher.subject}</p>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{teacher.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span>{teacher.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {teachers.length === 0 && (
                    <p className="text-center text-gray-500 py-8 col-span-2">
                      No teachers assigned to your semester yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manager Tab */}
          <TabsContent value="manager" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Manager</CardTitle>
                <CardDescription>Your reporting authority and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                {manager && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-indigo-600 text-white text-xl">
                          {manager.supervisor?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-lg">{manager.supervisor}</p>
                        <p className="text-sm text-gray-600">{manager.supervisorDesignation}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                          <Phone className="w-4 h-4" />
                          <span>{manager.supervisorPhone}</span>
                        </div>
                        <Badge className="mt-2">Primary Supervisor</Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <Users className="w-8 h-8 text-indigo-600 mb-2" />
                        <p className="text-sm text-gray-500">Dotted Supervisor</p>
                        <p className="text-lg mt-1">{manager.dottedSupervisor}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{manager.dottedSupervisorPhone}</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <Users className="w-8 h-8 text-indigo-600 mb-2" />
                        <p className="text-sm text-gray-500">Line Manager</p>
                        <p className="text-lg mt-1">{manager.lineManager}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{manager.lineManagerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
