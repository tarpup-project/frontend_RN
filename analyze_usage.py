import os
import re

CANDIDATE_DIRS = ['components', 'hooks', 'utils', 'state', 'api']
SEARCH_DIRS = ['app', 'components', 'hooks', 'utils', 'state', 'api', 'constants', 'context', 'services', 'types', '.']

IGNORE_CANDIDATES = ['index.ts', 'index.tsx', 'index.js', 'analyze_usage.py', '_analyze_usage.py', 'analyze_usage_v2.py']
IGNORE_SEARCH_FILES = ['.DS_Store', 'analyze_usage.py', '_analyze_usage.py', 'analyze_usage_v2.py', 'unused_files.txt']

def get_candidates():
    cands = []
    for d in CANDIDATE_DIRS:
        if not os.path.exists(d): continue
        for root, _, files in os.walk(d):
            if '__tests__' in root: continue
            for file in files:
                if file.startswith('.'): continue
                if file in IGNORE_CANDIDATES: continue
                if '.test.' in file or '.spec.' in file: continue
                
                if not file.endswith(('.ts', '.tsx', '.js', '.jsx')): continue
                cands.append(os.path.join(root, file))
    return cands

def get_search_corpus():
    corpus = []
    root_files = ['app.json', 'app.config.js', 'babel.config.js', 'metro.config.js', 'App.tsx', 'App.js', 'index.js', 'package.json']
    for rf in root_files:
        if os.path.exists(rf): corpus.append(rf)

    for d in SEARCH_DIRS:
        if d == '.': continue
        if not os.path.exists(d): continue
        for root, _, files in os.walk(d):
            if 'node_modules' in root: continue
            for file in files:
                if file.startswith('.'): continue
                if file in IGNORE_SEARCH_FILES: continue
                if not file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json')): continue
                corpus.append(os.path.join(root, file))
    return set(corpus)

def check_usage(target_file, corpus):
    basename = os.path.basename(target_file)
    name_no_ext = os.path.splitext(basename)[0]
    
    # CASE INSENSITIVE SEARCH
    pattern = re.compile(r'\b' + re.escape(name_no_ext) + r'\b', re.IGNORECASE)
    
    for file in corpus:
        if os.path.abspath(file) == os.path.abspath(target_file): continue
        
        try:
            with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if pattern.search(content):
                    return True
        except:
            pass
            
    return False

def main():
    cands = get_candidates()
    corpus = get_search_corpus()
    
    unused = []
    for c in cands:
        if not check_usage(c, corpus):
            unused.append(c)
            
    with open('unused_files.txt', 'w') as f:
        for u in unused:
            f.write(u + '\n')
            print(f"DELETE: {u}")

if __name__ == '__main__':
    main()
