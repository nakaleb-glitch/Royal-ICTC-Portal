import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const teachers = body.teachers

    if (!teachers || !Array.isArray(teachers)) {
      return new Response(
        JSON.stringify({ error: 'No teachers array provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []
    const errors = []

    for (const teacher of teachers) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: teacher.email,
        password: 'royal@123',
        email_confirm: true,
        user_metadata: {
          full_name: teacher.full_name,
          force_password_change: true
        }
      })

      if (error) {
        errors.push({ email: teacher.email, error: error.message })
      } else {
        // Use upsert instead of update so it creates the row if it doesn't exist
        const { error: upsertError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: data.user.id,
            email: teacher.email,
            full_name: teacher.full_name,
            role: 'teacher'
          }, { onConflict: 'id' })

        if (upsertError) {
          errors.push({ email: teacher.email, error: 'Auth created but profile failed: ' + upsertError.message })
        } else {
          results.push({ email: teacher.email, success: true })
        }
      }
    }

    return new Response(
      JSON.stringify({ results, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})