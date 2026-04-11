# ESL Centre Project Knowledge Reference
This file preserves all proven patterns, architecture, and code implementations from the existing gradebook system that can be reused for the new ESL centre website & application.

---

## ✅ PROJECT ARCHITECTURE PATTERNS

### Tech Stack Used & Proven:
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Hosting**: Vercel
- **File Handling**: XLSX, PDF generation

---

## ✅ CORE REUSABLE COMPONENTS

### 1. Authentication System
```
✅ AuthContext with role-based access
✅ Staff ID login system
✅ Student login system
✅ Password reset workflow
✅ Must change password on first login
✅ Session management
✅ Role-based route protection
```

Files to reference:
- `src/contexts/AuthContext.jsx`
- `src/pages/Login.jsx`
- `src/pages/AuthCallback.jsx`
- `supabase/staff_id_setup.sql`
- `supabase/student_login_setup.sql`

### 2. Database Patterns
```
✅ Row Level Security (RLS) policies properly implemented
✅ User roles: admin, teacher, student
✅ Separate tables with proper foreign keys
✅ Storage buckets with proper permissions
✅ Edge Functions for sensitive operations
✅ RPC functions for custom queries
```

### 3. Common Components
```
✅ Layout component with sidebar navigation
✅ Profile Avatar component with image upload
✅ Announcement PDF generation & attachments
✅ Table sorting, filtering, pagination patterns
✅ Form handling patterns
✅ File upload handling
✅ Excel template export/import
```

---

## ✅ FEATURE MODULES ALREADY BUILT THAT CAN BE ADAPTED:

| Feature | Status | Notes |
|---------|--------|-------|
| Student Management | ✅ Complete | CRUD, bulk import, attributes |
| Class Management | ✅ Complete | Levels, schedules, teacher assignment |
| Gradebooks | ✅ Complete | Multiple templates, comments |
| Weekly Lesson Plans | ✅ Complete | Teacher submission, admin review |
| Behavior Reports | ✅ Complete | Tracking, reporting |
| Events & Deadlines | ✅ Complete | Calendar, notifications |
| Resource Management | ✅ Complete | File upload, grade level filtering |
| User Management | ✅ Complete | Roles, permissions, password management |

---

## ✅ DATABASE SCHEMA REFERENCE

### Core Tables:
1.  `profiles` - Extended user information
2.  `students` - Student records
3.  `classes` - Class information
4.  `class_students` - Enrollment junction table
5.  `gradebooks` - Grade entries
6.  `weekly_plans` - Lesson plans
7.  `behavior_reports` - Student behavior tracking
8.  `announcements` - Communications
9.  `events_deadlines` - Calendar events
10. `resources` - Learning materials

---

## ✅ EDGE FUNCTIONS PATTERNS

All edge functions follow this proven pattern:
- Deno runtime
- Supabase admin client
- Proper error handling
- Permission checking
- Batch operations support

Existing working functions:
- `create-students` - Bulk student creation
- `create-teachers` - Bulk teacher creation
- `delete-user` - Safe user deletion
- `reset-user-password` - Password reset workflow

---

## ✅ BEST PRACTICES FOLLOWED:

1.  **Security**:
    - Never expose service_role key in frontend
    - All database operations go through RLS
    - Sensitive operations use Edge Functions
    - Proper input sanitization

2.  **UX Patterns**:
    - Loading states for all async operations
    - Error handling with user feedback
    - Confirmation dialogs for destructive actions
    - Responsive design for mobile + desktop

3.  **Code Organization**:
    - Contexts for global state
    - Lib folder for utilities
    - Components folder for shared UI
    - Pages folder for route components
    - Clear separation between admin and student views

---

## ✅ NEW ESL CENTRE PROJECT FEATURE PLAN

This is the complete feature set that will be implemented for the new project:

### 🔹 PUBLIC WEBSITE
- Home page with centre introduction
- Courses / Programs page
- About us / Team page
- Contact page with enquiry form
- Testimonials
- FAQ section
- News / Blog

### 🔹 INTERNAL PORTAL
**User Roles:**
- Super Admin
- Centre Administrators
- Teachers
- Students
- Parents

**Core Modules:**
1.  Enrollment Management
2.  Class Scheduling & Attendance
3.  Grade Tracking & Progress Reports
4.  Learning Management System
5.  Communication System
6.  Payment & Invoicing
7.  Reporting & Analytics
8.  Resource Library

---

## ✅ IMPLEMENTATION MILESTONES

1.  **Phase 1: Project Setup**
    - Initialize new repository
    - Setup React + Vite + Tailwind
    - Setup Supabase project
    - Configure authentication system

2.  **Phase 2: Public Website**
    - Build main pages
    - Implement responsive design
    - Add contact form

3.  **Phase 3: Core Admin System**
    - User management
    - Student management
    - Class management

4.  **Phase 4: Teacher Features**
    - Attendance tracking
    - Grade entry
    - Lesson plans

5.  **Phase 5: Student/Parent Portal**
    - Grade view
    - Attendance history
    - Assignments

6.  **Phase 6: Advanced Features**
    - Payments
    - Communications
    - Reports