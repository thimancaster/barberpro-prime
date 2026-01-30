import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateMemberRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: 'admin' | 'barber';
  commission_percentage?: number;
  product_commission_percentage?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate caller JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'not_authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is admin
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();
    
    if (callerRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'not_authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller's organization
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', caller.id)
      .single();

    if (!callerProfile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'no_organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateMemberRequest = await req.json();
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      role = 'barber', 
      commission_percentage = 50, 
      product_commission_percentage = 10 
    } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'missing_required_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'password_too_short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'email_already_exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'failed_to_create_user', details: createError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = newUser.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: newUserId,
      organization_id: callerProfile.organization_id,
      full_name,
      phone: phone || null,
      commission_percentage: commission_percentage,
      product_commission_percentage: product_commission_percentage,
      is_active: true
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Try to clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'failed_to_create_profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUserId,
      organization_id: callerProfile.organization_id,
      role: role
    });

    if (roleError) {
      console.error('Error creating role:', roleError);
    }

    // Get organization times for working hours
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('opening_time, closing_time')
      .eq('id', callerProfile.organization_id)
      .single();

    const openingTime = org?.opening_time || '09:00';
    const closingTime = org?.closing_time || '19:00';

    // Create default working hours (7 days)
    const workingHoursInserts = [];
    for (let day = 0; day <= 6; day++) {
      workingHoursInserts.push({
        profile_id: newUserId,
        day_of_week: day,
        start_time: openingTime,
        end_time: closingTime,
        is_working: day !== 0 // Sunday off by default
      });
    }

    const { error: hoursError } = await supabaseAdmin
      .from('working_hours')
      .insert(workingHoursInserts);

    if (hoursError) {
      console.error('Error creating working hours:', hoursError);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'internal_error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
