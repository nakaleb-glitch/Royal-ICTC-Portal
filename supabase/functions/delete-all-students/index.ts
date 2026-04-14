import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isMissingRelationError = (message: string) => {
  const m = String(message || '').toLowerCase()
  return m.includes('does not exist') || m.includes('could not find the table')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token)
    if (callerError || !callerData.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', callerData.user.id)
      .single()

    if (callerProfile?.role !== 'admin' && callerProfile?.role !== 'admin_teacher') {
      return new Response(JSON.stringify({ error: 'Only admins can delete all students' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, student_id')

    if (studentsError) {
      return new Response(JSON.stringify({ error: studentsError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const studentIds = (students || []).map((s) => s.id).filter(Boolean)
    const studentCodes = (students || []).map((s) => String(s.student_id || '').trim()).filter(Boolean)

    const summary: Record<string, number> = {}
    const errors: string[] = []

    const deleteByStudentId = async (table: string, column = 'student_id') => {
      if (studentIds.length === 0) return
      const { error, count } = await supabaseAdmin
        .from(table)
        .delete({ count: 'exact' })
        .in(column, studentIds)
      if (error) {
        if (isMissingRelationError(error.message)) return
        errors.push(`${table}: ${error.message}`)
        return
      }
      summary[table] = count || 0
    }

    // Cleanup dependent rows first.
    await deleteByStudentId('class_students')
    await deleteByStudentId('participation_grades')
    await deleteByStudentId('assignment_grades')
    await deleteByStudentId('progress_test_grades')
    await deleteByStudentId('student_attributes')
    await deleteByStudentId('behavior_reports')
    await deleteByStudentId('term_comments')

    // Optional cleanup for password reset requests keyed by student code.
    if (studentCodes.length > 0) {
      const { error: resetError, count: resetCount } = await supabaseAdmin
        .from('password_reset_requests')
        .delete({ count: 'exact' })
        .in('staff_id', studentCodes)
      if (resetError && !isMissingRelationError(resetError.message)) {
        errors.push(`password_reset_requests: ${resetError.message}`)
      } else {
        summary.password_reset_requests = resetCount || 0
      }
    }

    // Capture linked student profiles before deleting users.
    const { data: studentProfiles, error: profileQueryError } = await supabaseAdmin
      .from('users')
      .select('id, student_id_ref, role')
      .or(`role.eq.student,student_id_ref.in.(${studentIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)

    if (profileQueryError && !isMissingRelationError(profileQueryError.message)) {
      errors.push(`users lookup: ${profileQueryError.message}`)
    }

    const authUserIds = (studentProfiles || []).map((u) => u.id).filter(Boolean)

    // Delete profile rows tied to students.
    if (studentIds.length > 0) {
      const { error: usersDeleteError, count: usersDeleteCount } = await supabaseAdmin
        .from('users')
        .delete({ count: 'exact' })
        .or(`role.eq.student,student_id_ref.in.(${studentIds.join(',')})`)
      if (usersDeleteError && !isMissingRelationError(usersDeleteError.message)) {
        errors.push(`users delete: ${usersDeleteError.message}`)
      } else {
        summary.users = usersDeleteCount || 0
      }
    }

    // Delete students rows.
    const { error: studentsDeleteError, count: studentsDeleteCount } = await supabaseAdmin
      .from('students')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (studentsDeleteError) {
      errors.push(`students delete: ${studentsDeleteError.message}`)
    } else {
      summary.students = studentsDeleteCount || 0
    }

    // Delete auth accounts last (best effort and reported).
    let authDeleted = 0
    const authErrors: string[] = []
    for (const authUserId of authUserIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
      if (error) authErrors.push(`${authUserId}: ${error.message}`)
      else authDeleted += 1
    }

    return new Response(JSON.stringify({
      success: errors.length === 0 && authErrors.length === 0,
      deleted_counts: summary,
      auth_deleted: authDeleted,
      auth_errors: authErrors,
      errors,
    }), {
      status: errors.length > 0 ? 207 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
