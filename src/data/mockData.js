export const dashboardKPIs = [
  {
    id: 'total-students',
    label: 'TOTAL STUDENTS',
    value: '1,240',
    trend: '+2.4%',
    trendType: 'positive',
    icon: 'group',
    iconBg: 'bg-primary-fixed',
    iconColor: 'text-primary'
  },
  {
    id: 'fee-collection',
    label: 'FEE COLLECTION %',
    value: '88%',
    trend: 'In Progress',
    trendType: 'neutral',
    icon: 'payments',
    iconBg: 'bg-secondary-container',
    iconColor: 'text-secondary'
  },
  {
    id: 'attendance-today',
    label: 'ATTENDANCE % TODAY',
    value: '94%',
    trend: 'Above Avg',
    trendType: 'positive',
    icon: 'how_to_reg',
    iconBg: 'bg-primary-fixed',
    iconColor: 'text-primary'
  },
  {
    id: 'pending-admissions',
    label: 'PENDING ADMISSIONS',
    value: '12',
    trend: 'Priority',
    trendType: 'negative',
    icon: 'person_add_alt',
    iconBg: 'bg-error-container',
    iconColor: 'text-error'
  }
];

export const weeklyAttendanceTrend = [
  { day: 'MON', height: '92%', active: true },
  { day: 'TUE', height: '95%', active: true },
  { day: 'WED', height: '89%', active: true },
  { day: 'THU', height: '94%', active: true },
  { day: 'FRI', height: '91%', active: true },
  { day: 'SAT', height: '0%', active: false }
];

export const recentActivities = [
  {
    id: 1,
    title: 'Fee paid by John Doe',
    subtitle: 'Class 10-C • Ref ID: 8829',
    timestamp: '2 mins ago',
    icon: 'payments',
    bg: 'bg-secondary-container',
    color: 'text-on-secondary-container'
  },
  {
    id: 2,
    title: 'Attendance marked for Class 10A',
    subtitle: 'Staff: Mrs. Abernathy',
    timestamp: '15 mins ago',
    icon: 'task_alt',
    bg: 'bg-primary-fixed',
    color: 'text-primary'
  },
  {
    id: 3,
    title: 'New admission inquiry',
    subtitle: 'Guardian: David Wilson',
    timestamp: '1 hour ago',
    icon: 'description',
    bg: 'bg-tertiary-fixed',
    color: 'text-on-tertiary-fixed-variant'
  },
  {
    id: 4,
    title: 'Emergency Alert Broadcast',
    subtitle: 'Fire Drill completed successfully',
    timestamp: '3 hours ago',
    icon: 'notifications_active',
    bg: 'bg-surface-container-high',
    color: 'text-on-surface-variant'
  }
];

export const academicCalendarEvents = [
  {
    id: 1,
    title: 'Final Science Exhibition',
    dateTime: 'October 15, 2023 • 09:00 AM',
    border: 'border-secondary',
    bg: 'bg-secondary-container/10',
    textColor: 'text-secondary',
    icon: 'science'
  },
  {
    id: 2,
    title: 'PTA Meeting - Grade 12',
    dateTime: 'October 18, 2023 • 02:00 PM',
    border: 'border-primary',
    bg: 'bg-primary-fixed/10',
    textColor: 'text-primary',
    icon: 'groups'
  },
  {
    id: 3,
    title: 'Mid-Term Assessment Start',
    dateTime: 'October 22, 2023 • All Day',
    border: 'border-tertiary',
    bg: 'bg-tertiary-fixed/10',
    textColor: 'text-tertiary',
    icon: 'edit_calendar'
  },
  {
    id: 4,
    title: 'Staff Training Workshop',
    dateTime: 'October 25, 2023 • 04:00 PM',
    border: 'border-outline',
    bg: 'bg-surface-container',
    textColor: 'text-on-surface',
    icon: 'school'
  }
];

export const mockStudentsList = [
  {
    id: '#ST-2024-001',
    name: 'Julian Thorne',
    grade: 'Grade 4',
    section: 'Section A',
    guardian: 'Sarah Thorne',
    guardianContact: '+1 (555) 123-4567',
    feeStatus: 'Paid',
    attendance: 98,
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80',
    initials: 'JT'
  },
  {
    id: '#ST-2024-042',
    name: 'Amara Okafor',
    grade: 'Grade 4',
    section: 'Section B',
    guardian: 'Chidi Okafor',
    guardianContact: '+1 (555) 987-6543',
    feeStatus: 'Overdue',
    attendance: 72,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    initials: 'AO'
  },
  {
    id: '#ST-2024-089',
    name: 'Leo Vance',
    grade: 'Grade 3',
    section: 'Section A',
    guardian: 'Mark Vance',
    guardianContact: '+1 (555) 246-8135',
    feeStatus: 'Paid',
    attendance: 95,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    initials: 'LV'
  },
  {
    id: '#ST-2024-112',
    name: 'Sana Khan',
    grade: 'Grade 5',
    section: 'Section C',
    guardian: 'Tariq Khan',
    guardianContact: '+1 (555) 369-2580',
    feeStatus: 'Pending',
    attendance: 91,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    initials: 'SK'
  },
  {
    id: '#ST-2024-145',
    name: 'Ethan Rivera',
    grade: 'Grade 4',
    section: 'Section A',
    guardian: 'Maria Rivera',
    guardianContact: '+1 (555) 789-0123',
    feeStatus: 'Paid',
    attendance: 96,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    initials: 'ER'
  },
  {
    id: '#ST-2024-178',
    name: 'Chloe Bennett',
    grade: 'Grade 2',
    section: 'Section B',
    guardian: 'James Bennett',
    guardianContact: '+1 (555) 456-7890',
    feeStatus: 'Overdue',
    attendance: 88,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    initials: 'CB'
  }
];

export const mockRollCallStudents = [
  { rollNo: '01', id: '#ST-2024-001', name: 'Julian Thorne', initials: 'JD', status: 'Present' },
  { rollNo: '02', id: '#ST-2024-042', name: 'Amara Okafor', initials: 'AO', status: 'Absent' },
  { rollNo: '03', id: '#ST-2024-089', name: 'Leo Vance', initials: 'LV', status: 'Present' },
  { rollNo: '04', id: '#ST-2024-112', name: 'Sana Khan', initials: 'SK', status: 'Late' },
  { rollNo: '05', id: '#ST-2024-145', name: 'Ethan Rivera', initials: 'ER', status: 'Present' },
  { rollNo: '06', id: '#ST-2024-178', name: 'Chloe Bennett', initials: 'CB', status: 'Present' }
];

export const mockFeeInvoices = [
  {
    id: 'INV-2023-088',
    studentName: 'Julian Thorne',
    studentId: '#ST-2024-001',
    classSec: 'Class 10-A',
    amount: '$1,200',
    dueDate: 'Oct 15, 2023',
    status: 'Paid',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'INV-2023-094',
    studentName: 'Amara Okafor',
    studentId: '#ST-2024-042',
    classSec: 'Class 10-B',
    amount: '$1,450',
    dueDate: 'Oct 01, 2023',
    status: 'Overdue',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'INV-2023-102',
    studentName: 'Leo Vance',
    studentId: '#ST-2024-089',
    classSec: 'Class 9-A',
    amount: '$1,200',
    dueDate: 'Oct 20, 2023',
    status: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'INV-2023-115',
    studentName: 'Sana Khan',
    studentId: '#ST-2024-112',
    classSec: 'Class 11-C',
    amount: '$1,600',
    dueDate: 'Oct 15, 2023',
    status: 'Paid',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'INV-2023-128',
    studentName: 'Marcus Sterling',
    studentId: '#ST-2024-204',
    classSec: 'Class 12-A',
    amount: '$1,800',
    dueDate: 'Oct 05, 2023',
    status: 'Overdue',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'INV-2023-134',
    studentName: 'Hannah Abbott',
    studentId: '#ST-2024-221',
    classSec: 'Class 10-A',
    amount: '$1,200',
    dueDate: 'Oct 25, 2023',
    status: 'Pending',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  }
];

export const mockSectionPerformance = [
  { section: 'Class 10-A', students: 34, attendance: '96.2%', passRate: '98%', feeCollected: '94%' },
  { section: 'Class 10-B', students: 32, attendance: '92.4%', passRate: '91%', feeCollected: '82%' },
  { section: 'Class 10-C', students: 35, attendance: '94.8%', passRate: '95%', feeCollected: '88%' },
  { section: 'Class 11-A', students: 30, attendance: '97.1%', passRate: '99%', feeCollected: '96%' },
  { section: 'Class 11-B', students: 28, attendance: '91.5%', passRate: '89%', feeCollected: '78%' }
];
