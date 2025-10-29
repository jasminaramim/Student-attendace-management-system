import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  LogOut,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Bell,
  MessageSquare,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AdminDashboardProps {
  accessToken: string;
  user: any;
  onLogout: () => void;
}

export function AdminDashboard({ accessToken, user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [addAttendanceOpen, setAddAttendanceOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [semesterDialogOpen, setSemesterDialogOpen] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchAllAttendance();
    fetchStudents();
    fetchAllLeaves();
    fetchNotices();
    fetchComplaints();
    fetchTeachers();
    fetchSemesters();
  }, []);

  useEffect(() => {
    filterAttendanceRecords();
  }, [searchTerm, filterDate, allAttendance]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-attendance`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAllAttendance(data.records);
        setFilteredAttendance(data.records);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-students`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-leaves`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAllLeaves(data.leaves);
      }
    } catch (error) {
      console.error('Fetch leaves error:', error);
    }
  };

  const fetchNotices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-notices`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-complaints`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-teachers`,
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

  const fetchSemesters = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/all-semesters`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSemesters(data.semesters);
      }
    } catch (error) {
      console.error('Fetch semesters error:', error);
    }
  };

  const filterAttendanceRecords = () => {
    let filtered = allAttendance;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter((record) => record.date === filterDate);
    }

    setFilteredAttendance(filtered);
  };

  const handleUpdateAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const status = formData.get('status') as string;
    const checkIn = formData.get('checkIn') as string;
    const checkOut = formData.get('checkOut') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/update-attendance`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: selectedRecord.studentId,
            date: selectedRecord.date,
            updates: { status, checkIn, checkOut },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Attendance updated successfully!');
        setEditDialogOpen(false);
        fetchAllAttendance();
      } else {
        toast.error(data.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Update attendance error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleAddAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const studentId = formData.get('studentId') as string;
    const name = formData.get('name') as string;
    const date = formData.get('date') as string;
    const checkIn = formData.get('checkIn') as string;
    const checkOut = formData.get('checkOut') as string;
    const status = formData.get('status') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/add-attendance`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentId, name, date, checkIn, checkOut, status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Attendance added successfully!');
        setAddAttendanceOpen(false);
        fetchAllAttendance();
        fetchDashboardStats();
      } else {
        toast.error(data.error || 'Failed to add attendance');
      }
    } catch (error) {
      console.error('Add attendance error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleDeleteAttendance = async (record: any) => {
    if (!confirm(`Delete attendance for ${record.name} on ${record.date}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/delete-attendance`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentId: record.studentId, date: record.date }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Attendance deleted successfully!');
        fetchAllAttendance();
        fetchDashboardStats();
      } else {
        toast.error(data.error || 'Failed to delete attendance');
      }
    } catch (error) {
      console.error('Delete attendance error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleUpdateLeaveStatus = async (leave: any, status: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/update-leave-status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ leaveId: leave.id, status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(`Leave ${status.toLowerCase()} successfully!`);
        fetchAllLeaves();
        fetchDashboardStats();
      } else {
        toast.error(data.error || 'Failed to update leave status');
      }
    } catch (error) {
      console.error('Update leave status error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Date', 'Check-In', 'Check-Out', 'Duration', 'Status'];
    const rows = filteredAttendance.map((record) => [
      record.studentId,
      record.name,
      record.date,
      record.checkIn || 'N/A',
      record.checkOut || 'N/A',
      record.duration || 'N/A',
      record.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Report exported successfully!');
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

  const handleCreateNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const targetAudience = formData.get('targetAudience') as string;
    const semester = formData.get('semester') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/create-notice`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content, targetAudience, semester }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Notice posted successfully!');
        setNoticeDialogOpen(false);
        fetchNotices();
      } else {
        toast.error(data.error || 'Failed to create notice');
      }
    } catch (error) {
      console.error('Create notice error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Delete this notice?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/delete-notice`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ noticeId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Notice deleted successfully!');
        fetchNotices();
      } else {
        toast.error(data.error || 'Failed to delete notice');
      }
    } catch (error) {
      console.error('Delete notice error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleUpdateComplaintStatus = async (complaint: any, status: string, response?: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/update-complaint-status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ complaintId: complaint.id, status, response }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success('Complaint status updated!');
        fetchComplaints();
      } else {
        toast.error(data.error || 'Failed to update complaint');
      }
    } catch (error) {
      console.error('Update complaint error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const subject = formData.get('subject') as string;
    const semester = formData.get('semester') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/add-teacher`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, subject, semester, phone, email }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Teacher added successfully!');
        setTeacherDialogOpen(false);
        fetchTeachers();
      } else {
        toast.error(data.error || 'Failed to add teacher');
      }
    } catch (error) {
      console.error('Add teacher error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Delete this teacher?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/delete-teacher`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teacherId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Teacher deleted successfully!');
        fetchTeachers();
      } else {
        toast.error(data.error || 'Failed to delete teacher');
      }
    } catch (error) {
      console.error('Delete teacher error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleAddSemester = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0614540f/add-semester`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, code }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Semester added successfully!');
        setSemesterDialogOpen(false);
        fetchSemesters();
      } else {
        toast.error(data.error || 'Failed to add semester');
      }
    } catch (error) {
      console.error('Add semester error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage students and attendance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="noticeboard">Notices</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-indigo-500" />
                    <p className="text-3xl">{stats?.totalStudents || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Present Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <p className="text-3xl">{stats?.presentToday || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Absent Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <p className="text-3xl">{stats?.absentToday || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-500" />
                    <p className="text-3xl">{stats?.attendancePercentage || 0}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Leave Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>
                  {stats?.pendingLeaves || 0} leave applications awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allLeaves
                    .filter((leave) => leave.status === 'Pending')
                    .slice(0, 5)
                    .map((leave, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm">{leave.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {leave.type} - {leave.fromDate} to {leave.toDate}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{leave.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateLeaveStatus(leave, 'Approved')}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateLeaveStatus(leave, 'Rejected')}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  {allLeaves.filter((leave) => leave.status === 'Pending').length === 0 && (
                    <p className="text-center text-gray-500 py-8">No pending leave requests</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Check-In</th>
                        <th className="text-left py-3 px-4">Check-Out</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAttendance.slice(0, 10).map((record, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm">{record.name}</p>
                              <p className="text-xs text-gray-500">{record.studentId}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">{record.date}</td>
                          <td className="py-3 px-4">{record.checkIn || 'N/A'}</td>
                          <td className="py-3 px-4">{record.checkOut || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Management Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendance Management</CardTitle>
                    <CardDescription>View, edit, add, or delete attendance records</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={addAttendanceOpen} onOpenChange={setAddAttendanceOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Attendance
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Attendance Record</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddAttendance} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="add-studentId">Student ID</Label>
                            <Input id="add-studentId" name="studentId" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-name">Name</Label>
                            <Input id="add-name" name="name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-date">Date</Label>
                            <Input id="add-date" name="date" type="text" placeholder="29 Oct 2025" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-checkIn">Check-In</Label>
                            <Input id="add-checkIn" name="checkIn" placeholder="07:59 AM" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-checkOut">Check-Out</Label>
                            <Input id="add-checkOut" name="checkOut" placeholder="02:05 PM" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-status">Status</Label>
                            <Select name="status" required>
                              <SelectTrigger id="add-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="Late">Late</SelectItem>
                                <SelectItem value="Leave">Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Record'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or student ID..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Filter by date (29 Oct 2025)"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-64"
                  />
                </div>

                {/* Attendance Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Check-In</th>
                        <th className="text-left py-3 px-4">Check-Out</th>
                        <th className="text-left py-3 px-4">Duration</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm">{record.name}</p>
                              <p className="text-xs text-gray-500">{record.studentId}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">{record.date}</td>
                          <td className="py-3 px-4">{record.checkIn || 'N/A'}</td>
                          <td className="py-3 px-4">{record.checkOut || 'N/A'}</td>
                          <td className="py-3 px-4">{record.duration || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAttendance(record)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAttendance.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No attendance records found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Edit Attendance Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Attendance</DialogTitle>
                  <DialogDescription>
                    Modify attendance for {selectedRecord?.name}
                  </DialogDescription>
                </DialogHeader>
                {selectedRecord && (
                  <form onSubmit={handleUpdateAttendance} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-checkIn">Check-In</Label>
                      <Input
                        id="edit-checkIn"
                        name="checkIn"
                        defaultValue={selectedRecord.checkIn}
                        placeholder="07:59 AM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-checkOut">Check-Out</Label>
                      <Input
                        id="edit-checkOut"
                        name="checkOut"
                        defaultValue={selectedRecord.checkOut}
                        placeholder="02:05 PM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select name="status" defaultValue={selectedRecord.status}>
                        <SelectTrigger id="edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Absent">Absent</SelectItem>
                          <SelectItem value="Late">Late</SelectItem>
                          <SelectItem value="Leave">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Record'}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Manage student information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student ID</th>
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{student.studentId}</td>
                          <td className="py-3 px-4">{student.name}</td>
                          <td className="py-3 px-4">{student.email}</td>
                          <td className="py-3 px-4">{student.classInfo || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No students found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaves Tab */}
          <TabsContent value="leaves" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>Review and manage leave applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allLeaves.map((leave, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm">{leave.studentName}</p>
                          <p className="text-xs text-gray-500">({leave.studentId})</p>
                          {getLeaveStatusBadge(leave.status)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {leave.type} - {leave.fromDate} to {leave.toDate}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{leave.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">Applied on: {leave.appliedOn}</p>
                      </div>
                      {leave.status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateLeaveStatus(leave, 'Approved')}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateLeaveStatus(leave, 'Rejected')}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {allLeaves.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No leave applications found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
