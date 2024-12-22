export const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
export const PUBMED_TOOL_NAME = 'lovable_search';
export const PUBMED_EMAIL = 'support@lovable.dev';
export const TIMEOUT = 10000;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const requestHeaders = {
  'Accept': 'application/xml',
  'User-Agent': 'Mozilla/5.0'
};