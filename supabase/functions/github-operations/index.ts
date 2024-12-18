import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { repo_url, branch = 'main' } = await req.json()

    // Basic validation
    if (!repo_url) {
      throw new Error('Repository URL is required')
    }

    // Extract owner and repo name from URL
    const urlMatch = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!urlMatch) {
      throw new Error('Invalid GitHub repository URL format')
    }

    const [, owner, repo] = urlMatch
    console.log(`Verifying repository: ${owner}/${repo}`)

    // Get GitHub token
    const githubToken = Deno.env.get('GITHUB_ACCESS_TOKEN')
    if (!githubToken) {
      throw new Error('GitHub access token not configured')
    }

    // Verify repository exists and is accessible
    const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    })
    
    if (!githubResponse.ok) {
      console.error('GitHub API Error:', await githubResponse.text())
      throw new Error(
        githubResponse.status === 404 
          ? 'Repository not found' 
          : githubResponse.status === 401 
            ? 'Invalid GitHub token' 
            : 'Error accessing repository'
      )
    }

    const repoData = await githubResponse.json()
    console.log('Repository verified:', repoData.full_name)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Repository verified successfully',
        data: {
          owner,
          repo,
          full_name: repoData.full_name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})