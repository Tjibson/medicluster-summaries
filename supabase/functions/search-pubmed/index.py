from http.server import BaseHTTPRequestHandler
from Bio import Entrez
import json
import os
from datetime import datetime

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json'
    }

def handle_request(req):
    # Handle CORS preflight requests
    if req.method == 'OPTIONS':
        return {'statusCode': 204, 'headers': cors_headers()}

    try:
        # Parse request body
        body = json.loads(req.body)
        
        # Extract search parameters
        medicine = body.get('medicine', '')
        condition = body.get('condition', '')
        date_range = body.get('dateRange', {})
        journal_names = body.get('journalNames', [])
        
        # Configure Entrez
        Entrez.email = "your-email@example.com"  # Required by NCBI
        
        # Build search query
        query_parts = []
        
        if medicine:
            query_parts.append(f"({medicine})")
        if condition:
            query_parts.append(f"({condition})")
        if journal_names:
            journals_query = ' OR '.join(f'"{j}"[Journal]' for j in journal_names)
            query_parts.append(f"({journals_query})")
            
        # Add date range if provided
        if date_range:
            start_date = date_range.get('start', '')
            end_date = date_range.get('end', '')
            if start_date and end_date:
                query_parts.append(f"(\"{start_date}\"[Date - Publication] : \"{end_date}\"[Date - Publication])")
        
        # Combine all query parts
        search_query = ' AND '.join(query_parts)
        
        print(f"Executing PubMed search with query: {search_query}")
        
        # Search PubMed
        handle = Entrez.esearch(db="pubmed", term=search_query, retmax=100)
        record = Entrez.read(handle)
        handle.close()
        
        if not record['IdList']:
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'papers': [], 'message': 'No results found'})
            }
        
        # Fetch details for each paper
        handle = Entrez.efetch(db="pubmed", id=record['IdList'], rettype="medline", retmode="text")
        papers = []
        
        for paper in Entrez.parse(handle):
            try:
                # Extract paper details
                paper_data = {
                    'id': paper.get('PMID', [''])[0],
                    'title': paper.get('TI', ['No title'])[0],
                    'authors': [f"{author['LastName']} {author.get('ForeName', '')}" 
                              for author in paper.get('AU', [])],
                    'journal': paper.get('JT', ['Unknown Journal'])[0],
                    'year': int(paper.get('DP', ['0'])[0].split()[0]),
                    'abstract': paper.get('AB', ['No abstract available'])[0],
                    'citations': 0  # We'll update this in a separate request
                }
                papers.append(paper_data)
            except Exception as e:
                print(f"Error processing paper: {e}")
                continue
        
        # Sort papers by year (most recent first)
        papers.sort(key=lambda x: x['year'], reverse=True)
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'papers': papers,
                'message': 'Search completed successfully'
            })
        }
        
    except Exception as e:
        print(f"Error in search-pubmed function: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({
                'error': str(e),
                'papers': []
            })
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Create a request object that mimics the structure we need
        req = type('Request', (), {
            'method': 'POST',
            'body': post_data.decode('utf-8')
        })()
        
        result = handle_request(req)
        
        self.send_response(result['statusCode'])
        for key, value in result['headers'].items():
            self.send_header(key, value)
        self.end_headers()
        
        self.wfile.write(result['body'].encode('utf-8'))
        
    def do_OPTIONS(self):
        result = handle_request(type('Request', (), {'method': 'OPTIONS'})())
        self.send_response(result['statusCode'])
        for key, value in result['headers'].items():
            self.send_header(key, value)
        self.end_headers()