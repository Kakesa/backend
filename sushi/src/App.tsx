import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SchoolInitializer } from "@/components/ui/SchoolInitializer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/auth/Register";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { StudentLayout } from "./components/layout/StudentLayout";
import { TeacherLayout } from "./components/layout/TeacherLayout";
import { ParentLayout } from "./components/layout/ParentLayout";
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout";
import AdminHelp from "./pages/dashboard/AdminHelp";
import TeacherHelp from "./pages/teacher/TeacherHelp";
import StudentHelp from "./pages/student/StudentHelp";
import ParentHelp from "./pages/parent/ParentHelp";
import HelpManagement from "./pages/superadmin/HelpManagement";
import Overview from "./pages/dashboard/Overview";
import Students from "./pages/dashboard/Students";
import Teachers from "./pages/dashboard/Teachers";
import Parents from "./pages/dashboard/Parents";
import Courses from "./pages/dashboard/Courses";
import Attendance from "./pages/dashboard/Attendance";
import QRScanner from "./pages/dashboard/QRScanner";
import Grades from "./pages/dashboard/Grades";
import Settings from "./pages/dashboard/Settings";
import Messaging from "./pages/dashboard/Messaging";
import UsersPage from "./pages/dashboard/Users";
import ScheduleManagement from "./pages/dashboard/Schedule";
import Statistics from "./pages/dashboard/Statistics";
import Assignments from "./pages/dashboard/Assignments";
import Classes from "./pages/dashboard/Classes";
import Rooms from "./pages/dashboard/Rooms";
import SchoolCalendar from "./pages/dashboard/SchoolCalendar";
import Fees from "./pages/dashboard/Fees";
import StudentDashboard from "./pages/student/Dashboard";
import StudentGrades from "./pages/student/Grades";
import StudentFees from "./pages/student/Fees";
import StudentSchedule from "./pages/student/Schedule";
import StudentAttendance from "./pages/student/Attendance";
import StudentSettings from "./pages/student/Settings";
import StudentAssignments from "./pages/student/Assignments";
import StudentMessaging from "./pages/student/Messaging";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherClasses from "./pages/teacher/Classes";
import TeacherGrades from "./pages/teacher/Grades";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherSchedule from "./pages/teacher/Schedule";
import TeacherSettings from "./pages/teacher/Settings";
import TeacherMessaging from "./pages/teacher/Messaging";
import TeacherAssignmentCorrection from "./pages/teacher/AssignmentCorrection";
import TeacherAssignments from "./pages/teacher/Assignments";
import ParentDashboard from "./pages/parent/Dashboard";
import ParentChildren from "./pages/parent/Children";
import ParentGrades from "./pages/parent/Grades";
import ParentAssignments from "./pages/parent/Assignments";
import ParentAttendance from "./pages/parent/Attendance";
import ParentNotifications from "./pages/parent/Notifications";
import ParentSettings from "./pages/parent/Settings";
import ParentMessaging from "./pages/parent/Messaging";
import ParentAbsenceJustification from "./pages/parent/AbsenceJustification";
import SchoolSetup from "./pages/admin/SchoolSetup";
import JoinSchool from "./pages/JoinSchool";
import AbsenceValidation from "./pages/dashboard/AbsenceValidation";
import AdminAbsences from "./pages/dashboard/Absences";
import SharedCalendarPage from "./pages/calendar/SharedCalendarPage";
import TeacherCompetenceEvaluation from "./pages/teacher/CompetenceEvaluation";
import TeacherAbsences from "./pages/teacher/Absences";
import StudentCompetences from "./pages/student/Competences";
import AccountantDashboard from "./pages/accountant/Dashboard";
import AccountantFees from "./pages/accountant/Fees";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import SuperAdminSchools from "./pages/superadmin/Schools";
import SuperAdminAdmins from "./pages/superadmin/Admins";
import SuperAdminSubscriptions from "./pages/superadmin/Subscriptions";
import SuperAdminActivities from "./pages/superadmin/Activities";
import SuperAdminStatistics from "./pages/superadmin/Statistics";
import SuperAdminSettings from "./pages/superadmin/Settings";
import SuperAdminPayments from "./pages/superadmin/Payments";
import SuperAdminSchoolDetails from "./pages/superadmin/SchoolDetails";
import AdminArchive from "./pages/admin/AdminArchive";
import TeacherArchive from "./pages/teacher/TeacherArchive";
import StudentArchive from "./pages/student/StudentArchive";
import ParentArchive from "./pages/parent/ParentArchive";
import FinanceDashboard from "./pages/finance/Dashboard";
import Expenses from "./pages/finance/Expenses";
import Payments from "./pages/finance/Payments";
import StudentFinanceDetail from "./pages/finance/StudentDetail";
import FeesManagement from "./pages/finance/Fees";
import Reports from "./pages/finance/Reports";
import FinanceJournal from "./pages/finance/Journal";
import NotFound from "./pages/NotFound";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { GlobalProgressBar } from "@/components/layout/GlobalProgressBar";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import ProfilePage from "./pages/profile/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
          <TooltipProvider>
            <GlobalProgressBar />
            <Toaster />
            <Sonner />
            <SchoolInitializer>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/admin/school-setup" element={<SchoolSetup />} />
                <Route path="/activate-account" element={<ActivateAccount />} />
                <Route path="/join-school" element={<JoinSchool />} />
              <Route path="/activate-account" element={<ActivateAccount />} />
              <Route path="/join-school" element={<JoinSchool />} />

              {/* Super Admin Dashboard */}
              <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminLayout /></ProtectedRoute>}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="help" element={<HelpManagement />} />
                <Route path="schools" element={<SuperAdminSchools />} />
                <Route path="admins" element={<SuperAdminAdmins />} />
                <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
                <Route path="payments" element={<SuperAdminPayments />} />
                <Route path="statistics" element={<SuperAdminStatistics />} />
                <Route path="activities" element={<SuperAdminActivities />} />
                <Route path="settings" element={<SuperAdminSettings />} />
              </Route>

              {/* Admin Dashboard */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="students" element={<Students />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="parents" element={<Parents />} />
                <Route path="courses" element={<Courses />} />
                <Route path="classes" element={<Classes />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="schedule" element={<ScheduleManagement />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="absences" element={<AdminAbsences />} />
                <Route path="qr-scanner" element={<QRScanner />} />
                <Route path="grades" element={<Grades />} />
                <Route path="messaging" element={<Messaging />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="statistics" element={<Statistics />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="calendar" element={<SchoolCalendar />} />
                <Route path="absence-validation" element={<AbsenceValidation />} />
                <Route path="fees" element={<Fees />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="help" element={<AdminHelp />} />
                <Route path="archive" element={<AdminArchive />} />
                <Route path="finance">
                  <Route path="dashboard" element={<FinanceDashboard />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="student/:id" element={<StudentFinanceDetail />} />
                  <Route path="fees" element={<FeesManagement />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="journal" element={<FinanceJournal />} />
                </Route>
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Student Dashboard */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<StudentDashboard />} />
                <Route path="schedule" element={<StudentSchedule />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="grades" element={<StudentGrades />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="competences" element={<StudentCompetences />} />
                <Route path="messaging" element={<StudentMessaging />} />
                <Route path="calendar" element={<SharedCalendarPage />} />
                <Route path="fees" element={<StudentFees />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<StudentSettings />} />
                <Route path="help" element={<StudentHelp />} />
                <Route path="archive" element={<StudentArchive />} />
              </Route>

              {/* Teacher Dashboard */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]}><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="grades" element={<TeacherGrades />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="absences" element={<TeacherAbsences />} />
                <Route path="schedule" element={<TeacherSchedule />} />
                <Route path="settings" element={<TeacherSettings />} />
                <Route path="messaging" element={<TeacherMessaging />} />
                <Route path="corrections" element={<TeacherAssignmentCorrection />} />
                <Route path="competences" element={<TeacherCompetenceEvaluation />} />
                <Route path="calendar" element={<SharedCalendarPage />} />
                <Route path="help" element={<TeacherHelp />} />
                <Route path="archive" element={<TeacherArchive />} />
              </Route>

              {/* Parent Dashboard */}
              <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<ParentDashboard />} />
                <Route path="children" element={<ParentChildren />} />
                <Route path="assignments" element={<ParentAssignments />} />
                <Route path="grades" element={<ParentGrades />} />
                <Route path="attendance" element={<ParentAttendance />} />
                <Route path="notifications" element={<ParentNotifications />} />
                <Route path="messaging" element={<ParentMessaging />} />
                <Route path="absence-justification" element={<ParentAbsenceJustification />} />
                <Route path="calendar" element={<SharedCalendarPage />} />
                <Route path="fees" element={<StudentFees />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ParentSettings />} />
                <Route path="help" element={<ParentHelp />} />
                <Route path="archive" element={<ParentArchive />} />
              </Route>

              {/* Accountant Dashboard */}
              <Route path="/accountant" element={<ProtectedRoute allowedRoles={["accountant"]}><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<AccountantDashboard />} />
                <Route path="fees" element={<AccountantFees />} />
                <Route path="finance">
                  <Route path="dashboard" element={<FinanceDashboard />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="student/:id" element={<StudentFinanceDetail />} />
                  <Route path="fees" element={<FeesManagement />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="journal" element={<FinanceJournal />} />
                </Route>
                <Route path="messaging" element={<Messaging />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SchoolInitializer>
          </TooltipProvider>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;