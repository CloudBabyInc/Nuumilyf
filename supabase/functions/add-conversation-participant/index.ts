// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies will be applied.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { conversationId, userId } = await req.json()

    // Validate the request
    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the user from the auth context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if the current user is a participant in the conversation
    const { data: currentUserParticipation, error: participationError } = await supabaseClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participationError || !currentUserParticipation) {
      return new Response(
        JSON.stringify({ error: 'You are not a participant in this conversation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check if the target user exists
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if the target user is already a participant
    const { data: existingParticipation, error: existingError } = await supabaseClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingParticipation) {
      return new Response(
        JSON.stringify({ message: 'User is already a participant', id: existingParticipation.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add the target user as a participant using the service role
    const { data: newParticipant, error: insertError } = await supabaseAdmin
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        joined_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to add participant', details: insertError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Participant added successfully', id: newParticipant.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/* To invoke:
curl -i --location --request POST 'http://localhost:54321/functions/v1/add-conversation-participant' \
  --header 'Authorization: Bearer SUPABASE_AUTH_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"conversationId":"123e4567-e89b-12d3-a456-426614174000", "userId":"123e4567-e89b-12d3-a456-426614174001"}'
*/
