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
    // Get GitHub token first thing
    const githubToken = Deno.env.get('GITHUB_ACCESS_TOKEN')
    if (!githubToken) {
      console.error('GitHub token not found in environment variables')
      throw new Error('GitHub access token not configured. Please add your GitHub token in the Supabase Edge Function secrets.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { repo_url, branch = 'main' } = await req.json()
    console.log('Received request with repo_url:', repo_url, 'branch:', branch)

    // Basic validation
    if (!repo_url) {
      throw new Error('Repository URL is required')
    }

    // Extract owner and repo name from URL
    // Support both HTTPS and SSH URLs
    let owner, repo
    if (repo_url.startsWith('https://')) {
      const urlMatch = repo_url.match(/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/)
      if (!urlMatch) {
        throw new Error('Invalid GitHub repository URL format. Expected format: https://github.com/username/repository')
      }
      [, owner, repo] = urlMatch
    } else if (repo_url.startsWith('git@')) {
      const sshMatch = repo_url.match(/git@github\.com:([^\/]+)\/([^\/\.]+)(\.git)?$/)
      if (!sshMatch) {
        throw new Error('Invalid GitHub SSH URL format. Expected format: git@github.com:username/repository')
      }
      [, owner, repo] = sshMatch
    } else {
      throw new Error('Invalid repository URL format. Please use HTTPS or SSH URL.')
    }

    // Remove .git suffix if present
    repo = repo.replace(/\.git$/, '')

    console.log(`Verifying repository: ${owner}/${repo}`)

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
      if (githubResponse.status === 404) {
        throw new Error('Repository not found. Please check the URL and ensure the repository exists.')
      } else if (githubResponse.status === 401) {
        throw new Error('GitHub authentication failed. Please check if your token has the required permissions.')
      } else {
        throw new Error(`GitHub API error: ${githubResponse.status}`)
      }
    }

    const repoData = await githubResponse.json()
    console.log('Repository verified:', repoData.full_name)

    // Check if repository contains Python files
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    })

    if (!contentsResponse.ok) {
      throw new Error('Failed to fetch repository contents')
    }

    const contents = await contentsResponse.json()
    console.log('Repository contents:', contents)

    // Look for Python files that might contain PubMed scraping code
    const pythonFiles = contents.filter((file: any) => file.name.endsWith('.py'))
    if (pythonFiles.length === 0) {
      console.warn('No Python files found in repository')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Repository verified successfully',
        data: {
          owner,
          repo,
          full_name: repoData.full_name,
          python_files: pythonFiles.map((f: any) => f.name)
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