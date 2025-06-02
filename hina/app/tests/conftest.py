import pytest
import pandas as pd
import networkx as nx
import base64
import io
import os
from fastapi.testclient import TestClient
from hina.app.api.api import app

# Define paths to sample datasets
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')
SYNTHETIC_CSV_PATH = os.path.join(DATA_DIR, 'synthetic_data.csv')
SYNTHETIC_XLSX_PATH = os.path.join(DATA_DIR, 'synthetic_data_1.xlsx')

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_df():
    # Read a small sample from the synthetic dataset
    df = pd.read_csv(SYNTHETIC_CSV_PATH)
    # Take just first few rows to keep tests fast
    sample = df.head(4).copy()
    
    # Rename columns to match expected format for tests
    column_mapping = {
        'group': 'group',
        'student id': 'student',
        'code 2': 'object1',  # Using behavior code as object1
        'code 3': 'object2',  # Using interaction type as object2
        'task': 'attr'        # Using task as attribute
    }
    
    # Select and rename columns
    sample = sample[list(column_mapping.keys())].rename(columns=column_mapping)
    return sample

@pytest.fixture
def sample_csv():
    # Read from synthetic data and convert to CSV in memory
    df = pd.read_csv(SYNTHETIC_CSV_PATH)
    sample = df.head(4).copy()
    
    # Rename columns to match expected format for tests
    column_mapping = {
        'group': 'group',
        'student id': 'student',
        'code 2': 'object1',
        'code 3': 'object2',
        'task': 'attr'
    }
    
    # Select and rename columns
    sample = sample[list(column_mapping.keys())].rename(columns=column_mapping)
    
    # Convert to CSV in memory
    csv_buffer = io.BytesIO()
    sample.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    return csv_buffer

@pytest.fixture
def sample_xlsx():
    # Read from Excel example dataset
    df = pd.read_excel(SYNTHETIC_XLSX_PATH, sheet_name=0)
    sample = df.head(4).copy()
    
    # Convert to XLSX in memory
    xlsx_buffer = io.BytesIO()
    sample.to_excel(xlsx_buffer, index=False)
    xlsx_buffer.seek(0)
    return xlsx_buffer

@pytest.fixture
def base64_csv():
    # Read from synthetic data and convert to base64-encoded CSV
    df = pd.read_csv(SYNTHETIC_CSV_PATH)
    sample = df.head(4).copy()
    
    # Rename columns to match expected format for tests
    column_mapping = {
        'group': 'group',
        'student id': 'student',
        'code 2': 'object1',
        'code 3': 'object2',
        'task': 'attr'
    }
    
    # Select and rename columns
    sample = sample[list(column_mapping.keys())].rename(columns=column_mapping)
    
    # Convert to CSV string
    csv_str = sample.to_csv(index=False)
    
    # Encode to base64
    return base64.b64encode(csv_str.encode('utf-8')).decode('utf-8')

@pytest.fixture
def sample_graph(sample_df):
    # Create graph from the sample dataframe
    G = nx.Graph()
    
    # Extract unique students and objects
    students = sample_df['student'].unique()
    objects = sample_df['object1'].unique()
    
    # Add nodes with bipartite attribute
    G.add_nodes_from(students, bipartite='student')
    G.add_nodes_from(objects, bipartite='object1')
    
    # Add edges based on interactions in the dataframe
    for _, row in sample_df.iterrows():
        G.add_edge(row['student'], row['object1'], weight=1)
    
    return G

@pytest.fixture
def sample_graph_pos(sample_graph):
    G = sample_graph
    
    # Generate positions for the graph nodes
    pos = {}
    
    # Position students on the left
    students = [n for n, d in G.nodes(data=True) if d.get('bipartite') == 'student']
    for i, student in enumerate(students):
        pos[student] = (0.0, i * 1.0)
    
    # Position objects on the right
    objects = [n for n, d in G.nodes(data=True) if d.get('bipartite') == 'object1']
    for i, obj in enumerate(objects):
        pos[obj] = (1.0, i * 1.0)
    
    return G, pos