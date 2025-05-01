#!/bin/bash

# Make sure the script is executable
# chmod +x deploy-functions.sh

# Install Supabase CLI if not already installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI not found, installing..."
    brew install supabase/tap/supabase
fi

# Login to Supabase
echo "Please login to Supabase CLI..."
supabase login

# Link to your Supabase project
echo "Linking to your Supabase project..."
supabase link --project-ref ntyrjdiwsdccayaiwbmd

# Deploy the Edge Function
echo "Deploying Edge Function..."
supabase functions deploy add-conversation-participant

echo "Deployment complete!"
