import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to get current date/time
const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time, timestamp: now.getTime() };
};

// Helper function to calculate duration
const calculateDuration = (checkIn: string, checkOut: string) => {
  const parseTime = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  
  const diffMinutes = parseTime(checkOut) - parseTime(checkIn);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
};

// ============ AUTH ROUTES ============

app.post('/make-server-0614540f/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, studentId, role, semester } = body;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, studentId, role: role || 'student', semester },
      email_confirm: true,
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user data
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      studentId,
      role: role || 'student',
      semester,
    });

    // Initialize leave balance for students
    if (role === 'student' || !role) {
      await kv.set(`leaveBalance:${studentId}`, {
        CL: { taken: 0, total: 3 },
        SL: { taken: 0, total: 6 },
        EL: { taken: 0, total: 0 },
        LWP: { taken: 0, total: -1 },
      });

      // Set default manager with contact info
      await kv.set(`manager:${studentId}`, {
        supervisor: 'Dr. Sarah Johnson',
        supervisorDesignation: 'Head of Department',
        supervisorPhone: '+1-555-0101',
        dottedSupervisor: 'Prof. Michael Brown',
        dottedSupervisorPhone: '+1-555-0102',
        lineManager: 'Admin Office',
        lineManagerPhone: '+1-555-0100',
      });
    }

    return c.json({ success: true, user: data.user });
  } catch (err) {
    console.log(`Signup server error: ${err}`);
    return c.json({ error: 'Server error during signup' }, 500);
  }
});

app.post('/make-server-0614540f/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Login error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    const userData = await kv.get(`user:${data.user.id}`);
    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: userData,
    });
  } catch (err) {
    console.log(`Login server error: ${err}`);
    return c.json({ error: 'Server error during login' }, 500);
  }
});

// ============ STUDENT ROUTES ============

app.post('/make-server-0614540f/check-in', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const { date, time } = getCurrentDateTime();
    
    const attendanceKey = `attendance:${userData.studentId}:${date}`;
    const existing = await kv.get(attendanceKey);
    
    if (existing) {
      return c.json({ error: 'Already checked in today' }, 400);
    }

    const attendanceRecord = {
      studentId: userData.studentId,
      name: userData.name,
      date,
      checkIn: time,
      checkOut: null,
      duration: null,
      status: 'Present',
    };

    await kv.set(attendanceKey, attendanceRecord);
    return c.json({ success: true, record: attendanceRecord });
  } catch (err) {
    console.log(`Check-in error: ${err}`);
    return c.json({ error: 'Server error during check-in' }, 500);
  }
});

app.post('/make-server-0614540f/check-out', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const { date, time } = getCurrentDateTime();
    
    const attendanceKey = `attendance:${userData.studentId}:${date}`;
    const existing = await kv.get(attendanceKey);
    
    if (!existing) {
      return c.json({ error: 'No check-in found for today' }, 400);
    }

    if (existing.checkOut) {
      return c.json({ error: 'Already checked out today' }, 400);
    }

    const duration = calculateDuration(existing.checkIn, time);
    const updatedRecord = {
      ...existing,
      checkOut: time,
      duration,
    };

    await kv.set(attendanceKey, updatedRecord);
    return c.json({ success: true, record: updatedRecord });
  } catch (err) {
    console.log(`Check-out error: ${err}`);
    return c.json({ error: 'Server error during check-out' }, 500);
  }
});

app.get('/make-server-0614540f/my-attendance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const records = await kv.getByPrefix(`attendance:${userData.studentId}:`);
    
    // Sort by date (most recent first)
    const sorted = records.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return c.json({ success: true, records: sorted });
  } catch (err) {
    console.log(`Get attendance error: ${err}`);
    return c.json({ error: 'Server error fetching attendance' }, 500);
  }
});

app.post('/make-server-0614540f/apply-leave', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const body = await c.req.json();
    const { type, fromDate, toDate, reason } = body;

    const leaveId = `leave:${userData.studentId}:${Date.now()}`;
    const { date: appliedOn } = getCurrentDateTime();

    const leaveRecord = {
      id: leaveId,
      studentId: userData.studentId,
      studentName: userData.name,
      type,
      fromDate,
      toDate,
      reason,
      status: 'Pending',
      appliedOn,
    };

    await kv.set(leaveId, leaveRecord);
    return c.json({ success: true, leave: leaveRecord });
  } catch (err) {
    console.log(`Apply leave error: ${err}`);
    return c.json({ error: 'Server error applying leave' }, 500);
  }
});

app.get('/make-server-0614540f/my-leaves', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const leaves = await kv.getByPrefix(`leave:${userData.studentId}:`);

    return c.json({ success: true, leaves });
  } catch (err) {
    console.log(`Get leaves error: ${err}`);
    return c.json({ error: 'Server error fetching leaves' }, 500);
  }
});

app.get('/make-server-0614540f/leave-balance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const balance = await kv.get(`leaveBalance:${userData.studentId}`);

    return c.json({ success: true, balance });
  } catch (err) {
    console.log(`Get leave balance error: ${err}`);
    return c.json({ error: 'Server error fetching leave balance' }, 500);
  }
});

app.get('/make-server-0614540f/my-manager', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const manager = await kv.get(`manager:${userData.studentId}`);

    return c.json({ success: true, manager });
  } catch (err) {
    console.log(`Get manager error: ${err}`);
    return c.json({ error: 'Server error fetching manager' }, 500);
  }
});

// ============ ADMIN ROUTES ============

app.get('/make-server-0614540f/dashboard', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get all students
    const allUsers = await kv.getByPrefix('user:');
    const students = allUsers.filter((u: any) => u.role === 'student');

    // Get today's attendance
    const { date } = getCurrentDateTime();
    const todayAttendance = await kv.getByPrefix(`attendance:`);
    const todayRecords = todayAttendance.filter((r: any) => r.date === date);

    const totalStudents = students.length;
    const presentToday = todayRecords.filter((r: any) => r.status === 'Present').length;
    const absentToday = totalStudents - presentToday;
    const attendancePercentage = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

    // Get leave applications
    const allLeaves = await kv.getByPrefix('leave:');
    const pendingLeaves = allLeaves.filter((l: any) => l.status === 'Pending').length;

    return c.json({
      success: true,
      stats: {
        totalStudents,
        presentToday,
        absentToday,
        attendancePercentage,
        pendingLeaves,
      },
    });
  } catch (err) {
    console.log(`Dashboard error: ${err}`);
    return c.json({ error: 'Server error fetching dashboard' }, 500);
  }
});

app.get('/make-server-0614540f/all-attendance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allAttendance = await kv.getByPrefix('attendance:');
    
    // Sort by date (most recent first)
    const sorted = allAttendance.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return c.json({ success: true, records: sorted });
  } catch (err) {
    console.log(`Get all attendance error: ${err}`);
    return c.json({ error: 'Server error fetching attendance' }, 500);
  }
});

app.post('/make-server-0614540f/update-attendance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { studentId, date, updates } = body;

    const attendanceKey = `attendance:${studentId}:${date}`;
    const existing = await kv.get(attendanceKey);

    if (!existing) {
      return c.json({ error: 'Attendance record not found' }, 404);
    }

    const updatedRecord = { ...existing, ...updates };
    await kv.set(attendanceKey, updatedRecord);

    return c.json({ success: true, record: updatedRecord });
  } catch (err) {
    console.log(`Update attendance error: ${err}`);
    return c.json({ error: 'Server error updating attendance' }, 500);
  }
});

app.post('/make-server-0614540f/add-attendance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { studentId, name, date, checkIn, checkOut, status } = body;

    const attendanceKey = `attendance:${studentId}:${date}`;
    const duration = checkIn && checkOut ? calculateDuration(checkIn, checkOut) : null;

    const attendanceRecord = {
      studentId,
      name,
      date,
      checkIn,
      checkOut,
      duration,
      status,
    };

    await kv.set(attendanceKey, attendanceRecord);
    return c.json({ success: true, record: attendanceRecord });
  } catch (err) {
    console.log(`Add attendance error: ${err}`);
    return c.json({ error: 'Server error adding attendance' }, 500);
  }
});

app.delete('/make-server-0614540f/delete-attendance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { studentId, date } = body;

    const attendanceKey = `attendance:${studentId}:${date}`;
    await kv.del(attendanceKey);

    return c.json({ success: true });
  } catch (err) {
    console.log(`Delete attendance error: ${err}`);
    return c.json({ error: 'Server error deleting attendance' }, 500);
  }
});

app.get('/make-server-0614540f/all-students', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const students = allUsers.filter((u: any) => u.role === 'student');

    return c.json({ success: true, students });
  } catch (err) {
    console.log(`Get all students error: ${err}`);
    return c.json({ error: 'Server error fetching students' }, 500);
  }
});

app.get('/make-server-0614540f/all-leaves', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allLeaves = await kv.getByPrefix('leave:');

    return c.json({ success: true, leaves: allLeaves });
  } catch (err) {
    console.log(`Get all leaves error: ${err}`);
    return c.json({ error: 'Server error fetching leaves' }, 500);
  }
});

app.post('/make-server-0614540f/update-leave-status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { leaveId, status } = body;

    const leave = await kv.get(leaveId);
    if (!leave) {
      return c.json({ error: 'Leave not found' }, 404);
    }

    const updatedLeave = { ...leave, status };
    await kv.set(leaveId, updatedLeave);

    // Update leave balance if approved
    if (status === 'Approved') {
      const balance = await kv.get(`leaveBalance:${leave.studentId}`);
      if (balance && balance[leave.type]) {
        // Calculate days (simplified - counting 1 day for demo)
        const days = 1;
        balance[leave.type].taken += days;
        await kv.set(`leaveBalance:${leave.studentId}`, balance);
      }
    }

    return c.json({ success: true, leave: updatedLeave });
  } catch (err) {
    console.log(`Update leave status error: ${err}`);
    return c.json({ error: 'Server error updating leave' }, 500);
  }
});

// ============ NOTICEBOARD ROUTES ============

app.post('/make-server-0614540f/create-notice', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { title, content, targetAudience, semester, attachments } = body;

    const noticeId = `notice:${Date.now()}`;
    const { date: postedOn } = getCurrentDateTime();

    const notice = {
      id: noticeId,
      title,
      content,
      targetAudience,
      semester: semester || 'all',
      attachments: attachments || [],
      postedBy: userData.name,
      postedOn,
      reactions: {},
    };

    await kv.set(noticeId, notice);
    return c.json({ success: true, notice });
  } catch (err) {
    console.log(`Create notice error: ${err}`);
    return c.json({ error: 'Server error creating notice' }, 500);
  }
});

app.get('/make-server-0614540f/all-notices', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allNotices = await kv.getByPrefix('notice:');
    
    // Sort by date (most recent first)
    const sorted = allNotices.sort((a, b) => {
      return b.id.split(':')[1] - a.id.split(':')[1];
    });

    return c.json({ success: true, notices: sorted });
  } catch (err) {
    console.log(`Get all notices error: ${err}`);
    return c.json({ error: 'Server error fetching notices' }, 500);
  }
});

app.get('/make-server-0614540f/my-notices', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const allNotices = await kv.getByPrefix('notice:');
    
    // Filter notices for this student's semester or general
    const filtered = allNotices.filter((notice: any) => 
      notice.targetAudience === 'All Students' || 
      notice.semester === 'all' ||
      notice.semester === userData.semester
    );

    // Sort by date (most recent first)
    const sorted = filtered.sort((a, b) => {
      return b.id.split(':')[1] - a.id.split(':')[1];
    });

    return c.json({ success: true, notices: sorted });
  } catch (err) {
    console.log(`Get my notices error: ${err}`);
    return c.json({ error: 'Server error fetching notices' }, 500);
  }
});

app.post('/make-server-0614540f/react-to-notice', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { noticeId, reaction } = body;

    const notice = await kv.get(noticeId);
    if (!notice) {
      return c.json({ error: 'Notice not found' }, 404);
    }

    notice.reactions[user.id] = reaction;
    await kv.set(noticeId, notice);

    return c.json({ success: true, notice });
  } catch (err) {
    console.log(`React to notice error: ${err}`);
    return c.json({ error: 'Server error reacting to notice' }, 500);
  }
});

app.post('/make-server-0614540f/update-notice', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { noticeId, updates } = body;

    const notice = await kv.get(noticeId);
    if (!notice) {
      return c.json({ error: 'Notice not found' }, 404);
    }

    const updatedNotice = { ...notice, ...updates };
    await kv.set(noticeId, updatedNotice);

    return c.json({ success: true, notice: updatedNotice });
  } catch (err) {
    console.log(`Update notice error: ${err}`);
    return c.json({ error: 'Server error updating notice' }, 500);
  }
});

app.delete('/make-server-0614540f/delete-notice', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { noticeId } = body;

    await kv.del(noticeId);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Delete notice error: ${err}`);
    return c.json({ error: 'Server error deleting notice' }, 500);
  }
});

// ============ COMPLAINT ROUTES ============

app.post('/make-server-0614540f/submit-complaint', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const body = await c.req.json();
    const { subject, description, attachments } = body;

    const complaintId = `complaint:${userData.studentId}:${Date.now()}`;
    const { date: submittedOn } = getCurrentDateTime();

    const complaint = {
      id: complaintId,
      studentId: userData.studentId,
      studentName: userData.name,
      studentEmail: userData.email,
      subject,
      description,
      attachments: attachments || [],
      status: 'Pending',
      submittedOn,
      response: null,
    };

    await kv.set(complaintId, complaint);
    return c.json({ success: true, complaint });
  } catch (err) {
    console.log(`Submit complaint error: ${err}`);
    return c.json({ error: 'Server error submitting complaint' }, 500);
  }
});

app.get('/make-server-0614540f/my-complaints', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const complaints = await kv.getByPrefix(`complaint:${userData.studentId}:`);

    // Sort by date (most recent first)
    const sorted = complaints.sort((a, b) => {
      return b.id.split(':')[2] - a.id.split(':')[2];
    });

    return c.json({ success: true, complaints: sorted });
  } catch (err) {
    console.log(`Get my complaints error: ${err}`);
    return c.json({ error: 'Server error fetching complaints' }, 500);
  }
});

app.get('/make-server-0614540f/all-complaints', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allComplaints = await kv.getByPrefix('complaint:');

    // Sort by date (most recent first)
    const sorted = allComplaints.sort((a, b) => {
      return b.id.split(':')[2] - a.id.split(':')[2];
    });

    return c.json({ success: true, complaints: sorted });
  } catch (err) {
    console.log(`Get all complaints error: ${err}`);
    return c.json({ error: 'Server error fetching complaints' }, 500);
  }
});

app.post('/make-server-0614540f/update-complaint-status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { complaintId, status, response } = body;

    const complaint = await kv.get(complaintId);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    const updatedComplaint = { ...complaint, status, response: response || complaint.response };
    await kv.set(complaintId, updatedComplaint);

    return c.json({ success: true, complaint: updatedComplaint });
  } catch (err) {
    console.log(`Update complaint status error: ${err}`);
    return c.json({ error: 'Server error updating complaint' }, 500);
  }
});

// ============ TEACHER & SEMESTER ROUTES ============

app.post('/make-server-0614540f/add-semester', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { name, code } = body;

    const semesterId = `semester:${code}`;
    const semester = {
      id: semesterId,
      name,
      code,
    };

    await kv.set(semesterId, semester);
    return c.json({ success: true, semester });
  } catch (err) {
    console.log(`Add semester error: ${err}`);
    return c.json({ error: 'Server error adding semester' }, 500);
  }
});

app.get('/make-server-0614540f/all-semesters', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const semesters = await kv.getByPrefix('semester:');
    return c.json({ success: true, semesters });
  } catch (err) {
    console.log(`Get semesters error: ${err}`);
    return c.json({ error: 'Server error fetching semesters' }, 500);
  }
});

app.post('/make-server-0614540f/add-teacher', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { name, subject, semester, phone, email } = body;

    const teacherId = `teacher:${Date.now()}`;
    const teacher = {
      id: teacherId,
      name,
      subject,
      semester,
      phone,
      email,
    };

    await kv.set(teacherId, teacher);
    return c.json({ success: true, teacher });
  } catch (err) {
    console.log(`Add teacher error: ${err}`);
    return c.json({ error: 'Server error adding teacher' }, 500);
  }
});

app.get('/make-server-0614540f/all-teachers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const teachers = await kv.getByPrefix('teacher:');
    return c.json({ success: true, teachers });
  } catch (err) {
    console.log(`Get teachers error: ${err}`);
    return c.json({ error: 'Server error fetching teachers' }, 500);
  }
});

app.get('/make-server-0614540f/my-teachers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    const allTeachers = await kv.getByPrefix('teacher:');
    
    // Filter teachers for this student's semester
    const filtered = allTeachers.filter((teacher: any) => teacher.semester === userData.semester);

    return c.json({ success: true, teachers: filtered });
  } catch (err) {
    console.log(`Get my teachers error: ${err}`);
    return c.json({ error: 'Server error fetching teachers' }, 500);
  }
});

app.post('/make-server-0614540f/update-teacher', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { teacherId, updates } = body;

    const teacher = await kv.get(teacherId);
    if (!teacher) {
      return c.json({ error: 'Teacher not found' }, 404);
    }

    const updatedTeacher = { ...teacher, ...updates };
    await kv.set(teacherId, updatedTeacher);

    return c.json({ success: true, teacher: updatedTeacher });
  } catch (err) {
    console.log(`Update teacher error: ${err}`);
    return c.json({ error: 'Server error updating teacher' }, 500);
  }
});

app.delete('/make-server-0614540f/delete-teacher', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { teacherId } = body;

    await kv.del(teacherId);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Delete teacher error: ${err}`);
    return c.json({ error: 'Server error deleting teacher' }, 500);
  }
});

Deno.serve(app.fetch);
