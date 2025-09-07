import json
import sys
from collections import Counter
from datetime import datetime

def analyze_json_file(filename):
    """Analyze the improvedDemoData.json file structure"""
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("=" * 60)
        print("IMPROVED DEMO DATA ANALYSIS")
        print("=" * 60)
        
        # Basic info
        print(f"\nFile: {filename}")
        print(f"Version: {data.get('version', 'unknown')}")
        print(f"Generated: {data.get('generated', 'unknown')}")
        print(f"Total Businesses (claimed): {data.get('totalBusinesses', 'unknown')}")
        
        # Metadata
        if 'metadata' in data:
            print("\nMETADATA:")
            meta = data['metadata']
            print(f"  Description: {meta.get('description', 'N/A')}")
            if 'dataQuality' in meta:
                print("  Data Quality Flags:")
                for key, value in meta['dataQuality'].items():
                    print(f"    - {key}: {value}")
        
        # Analyze businesses array
        if 'businesses' in data:
            businesses = data['businesses']
            print(f"\nBUSINESSES ARRAY:")
            print(f"  Actual count in array: {len(businesses)}")
            
            # Sample first few businesses
            print("\n  First 5 businesses:")
            for i, biz in enumerate(businesses[:5]):
                print(f"    {i+1}. ID: {biz.get('id', 'N/A')}, Name: {biz.get('name', 'N/A')}")
            
            # Analyze ID patterns
            print("\n  ID Patterns:")
            id_types = Counter()
            for biz in businesses:
                biz_id = str(biz.get('id', ''))
                if biz_id.startswith('prof-'):
                    id_types['Professional (prof-)'] += 1
                elif biz_id.isdigit():
                    id_types['Numeric'] += 1
                else:
                    id_types['Other'] += 1
            
            for id_type, count in id_types.items():
                print(f"    - {id_type}: {count}")
            
            # Industry breakdown
            print("\n  Industries (top 10):")
            industries = Counter(biz.get('industry', 'Unknown') for biz in businesses)
            for industry, count in industries.most_common(10):
                print(f"    - {industry}: {count}")
            
            # Neighborhood breakdown
            print("\n  Neighborhoods (top 10):")
            neighborhoods = Counter(biz.get('neighborhood', 'Unknown') for biz in businesses)
            for neighborhood, count in neighborhoods.most_common(10):
                print(f"    - {neighborhood}: {count}")
            
            # Check for duplicates
            print("\n  Duplicate Check:")
            names = [biz.get('name', '') for biz in businesses]
            name_counts = Counter(names)
            duplicates = {name: count for name, count in name_counts.items() if count > 1}
            if duplicates:
                print(f"    Found {len(duplicates)} duplicate business names:")
                for name, count in list(duplicates.items())[:10]:
                    print(f"      - '{name}': appears {count} times")
            else:
                print("    No duplicate names found")
            
            # Check data structure of first business
            if businesses:
                print("\n  Structure of first business object:")
                first_biz = businesses[0]
                print(f"    Top-level keys ({len(first_biz.keys())} total):")
                for key in list(first_biz.keys())[:15]:
                    print(f"      - {key}")
                
                # Check address structure
                if 'address' in first_biz:
                    print(f"\n    Address structure:")
                    for key in first_biz['address'].keys():
                        print(f"      - {key}: {first_biz['address'][key]}")
                
                # Check for embedding field
                has_embedding = any('embedding' in biz for biz in businesses)
                print(f"\n    Has embedding field in any business: {has_embedding}")
                
                # Check businessAge distribution
                print("\n  Business Age Distribution:")
                ages = Counter(biz.get('businessAge', 'Unknown') for biz in businesses)
                for age, count in sorted(ages.items())[:10]:
                    print(f"    - Age {age}: {count} businesses")
        
        print("\n" + "=" * 60)
        print("SUMMARY:")
        print(f"  - File claims {data.get('totalBusinesses', '?')} businesses")
        print(f"  - Actually contains {len(businesses)} business objects")
        print(f"  - Data appears to be demo/test data: {businesses[0].get('isDemo', False) if businesses else 'Unknown'}")
        print(f"  - Data version: {businesses[0].get('dataVersion', 'Unknown') if businesses else 'Unknown'}")
        print("=" * 60)
        
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file - {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_json_file("improvedDemoData.json")