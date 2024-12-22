export const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
export const TIMEOUT = 5000;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const requestHeaders = {
  'Accept': 'application/xml',
  'User-Agent': 'Mozilla/5.0'
};