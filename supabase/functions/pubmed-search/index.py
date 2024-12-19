import os
import json
from typing import Dict, List, Optional
from http.server import BaseHTTPRequestHandler
from Bio import Entrez
from datetime import datetime

# Set your email for NCBI's tracking purposes
Entrez.email = "your-app@mediscrape.com"

# CORS headers for browser access
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
}

def search_pubmed(query: str, start_date: Optional[str] = None, end_date: Optional[str] = None, max_results: int = 25) -> List[Dict]:
    try:
        # Construct date range if provided
        date_range = ''
        if start_date and end_date:
            date_range = f" AND (\"{start_date}\"[Date - Publication] : \"{end_date}\"[Date - Publication])"
        
        # Initial search to get IDs
        search_term = f"{query}{date_range}"
        print(f"Searching PubMed with query: {search_term}")
        
        handle = Entrez.esearch(db="pubmed", term=search_term, retmax=max_results, sort="relevance")
        search_results = Entrez.read(handle)
        handle.close()

        if not search_results["IdList"]:
            print("No results found")
            return []

        # Fetch details for found articles
        ids = ','.join(search_results["IdList"])
        handle = Entrez.efetch(db="pubmed", id=ids, rettype="medline", retmode="text")
        records = Entrez.parse(handle)
        
        articles = []
        for record in records:
            # Extract basic information
            article = {
                "id": record.get("PMID", [""])[0],
                "title": record.get("TI", ["No title available"])[0],
                "abstract": record.get("AB", ["No abstract available"])[0],
                "authors": [author for author in record.get("AU", [])],
                "journal": record.get("JT", ["Unknown Journal"])[0],
                "year": int(record.get("DP", ["0"])[0][:4]),
                "citations": 0  # Will be updated with citation count
            }
            
            # Get citation count using a separate query
            try:
                cite_handle = Entrez.elink(dbfrom="pubmed", db="pmc", id=article["id"], linkname="pubmed_pmc_refs")
                cite_results = Entrez.read(cite_handle)
                cite_handle.close()
                
                if cite_results[0]["LinkSetDb"]:
                    article["citations"] = len(cite_results[0]["LinkSetDb"][0]["Link"])
            except Exception as e:
                print(f"Error fetching citations for {article['id']}: {str(e)}")
                
            articles.append(article)
        
        # Sort by citations (descending)
        articles.sort(key=lambda x: x["citations"], reverse=True)
        return articles

    except Exception as e:
        print(f"Error in search_pubmed: {str(e)}")
        raise e

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            request_body = self.rfile.read(content_length)
            request_data = json.loads(request_body)
            
            # Extract search parameters
            keywords = request_data.get('keywords', '')
            date_range = request_data.get('dateRange', {})
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            
            # Perform search
            results = search_pubmed(
                query=keywords,
                start_date=start_date,
                end_date=end_date
            )
            
            # Send response
            self.send_response(200)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.end_headers()
            
            response_data = json.dumps({"papers": results})
            self.wfile.write(response_data.encode('utf-8'))
            
        except Exception as e:
            print(f"Error processing request: {str(e)}")
            self.send_response(500)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.end_headers()
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode('utf-8'))