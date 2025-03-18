import pytest
import pandas as pd
import networkx as nx
from hina.construction.network_construct import get_bipartite, get_tripartite

def test_get_bipartite():
    """
    Test the `get_bipartite` function to ensure it correctly constructs a bipartite graph
    with the expected nodes, edges, and attributes.
    """
    # Create a sample DataFrame
    data = {
        'student': ['Alice', 'Bob', 'Alice', 'Charlie'],
        'object': ['ask questions', 'answer questions', 'evaluating', 'monitoring'],
        'group': ['A', 'B', 'A', 'B'],
        'attr': ['cognitive', 'cognitive', 'metacognitive', 'metacognitive']
    }
    df = pd.DataFrame(data)

    # Generate the bipartite graph
    B = get_bipartite(df, student_col='student', object_col='object', attr_col='attr', group_col='group')

    # Verify the graph structure and attributes
    assert isinstance(B, nx.Graph), "Output should be a NetworkX graph."

    # Check nodes and their attributes
    expected_nodes = [
        ('Alice', {'bipartite': 'student', 'group': 'A'}),
        ('Bob', {'bipartite': 'student', 'group': 'B'}),
        ('Charlie', {'bipartite': 'student', 'group': 'B'}),
        ('ask questions', {'bipartite': 'object', 'attr': 'cognitive'}),
        ('answer questions', {'bipartite': 'object', 'attr': 'cognitive'}),
        ('evaluating', {'bipartite': 'object', 'attr': 'metacognitive'}),
        ('monitoring', {'bipartite': 'object', 'attr': 'metacognitive'})
    ]
    for node, expected_attrs in expected_nodes:
        assert node in B.nodes, f"Node {node} is missing."
        assert B.nodes[node] == expected_attrs, f"Attributes for node {node} are incorrect."

    # Check edges and their weights
    expected_edges = [
        ('Alice', 'ask questions', {'weight': 1}),
        ('Alice', 'evaluating', {'weight': 1}),
        ('Bob', 'answer questions', {'weight': 1}),
        ('Charlie', 'monitoring', {'weight': 1})
    ]
    for u, v, expected_attrs in expected_edges:
        assert B.has_edge(u, v), f"Edge ({u}, {v}) is missing."
        assert B[u][v] == expected_attrs, f"Edge attributes for ({u}, {v}) are incorrect."

def test_get_tripartite():
    """
    Test the `get_tripartite` function to ensure it correctly constructs a tripartite graph
    with the expected nodes, edges, and attributes.
    """
    # Create a sample DataFrame
    data = {
        'student': ['Alice', 'Bob', 'Alice', 'Charlie'],
        'object1': ['ask questions', 'answer questions', 'evaluating', 'monitoring'],
        'object2': ['tilt head', 'shake head', 'nod head', 'nod head'],
        'group': ['A', 'B', 'A', 'B']
    }
    df = pd.DataFrame(data)

    # Generate the tripartite graph
    T = get_tripartite(df, student_col='student', object1_col='object1', object2_col='object2', group_col='group')

    # Verify the graph structure and attributes
    assert isinstance(T, nx.Graph), "Output should be a NetworkX graph."

    # Check nodes and their attributes
    expected_nodes = [
        ('Alice', {'bipartite': 'student', 'group': 'A'}),
        ('Bob', {'bipartite': 'student', 'group': 'B'}),
        ('Charlie', {'bipartite': 'student', 'group': 'B'}),
        ('ask questions**tilt head', {'bipartite': '(object1,object2)', 'tripartite': True}),
        ('answer questions**shake head', {'bipartite': '(object1,object2)', 'tripartite': True}),
        ('evaluating**nod head', {'bipartite': '(object1,object2)', 'tripartite': True}),
        ('monitoring**nod head', {'bipartite': '(object1,object2)', 'tripartite': True})
    ]
    for node, expected_attrs in expected_nodes:
        assert node in T.nodes, f"Node {node} is missing."
        assert T.nodes[node] == expected_attrs, f"Attributes for node {node} are incorrect."

    # Check edges and their weights
    expected_edges = [
        ('Alice', 'ask questions**tilt head', {'weight': 1}),
        ('Alice', 'evaluating**nod head', {'weight': 1}),
        ('Bob', 'answer questions**shake head', {'weight': 1}),
        ('Charlie', 'monitoring**nod head', {'weight': 1})
    ]
    for u, v, expected_attrs in expected_edges:
        assert T.has_edge(u, v), f"Edge ({u}, {v}) is missing."
        assert T[u][v] == expected_attrs, f"Edge attributes for ({u}, {v}) are incorrect."

if __name__ == "__main__":
    pytest.main()
Key Features of the Test File:
