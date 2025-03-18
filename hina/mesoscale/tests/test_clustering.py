import pytest
import networkx as nx
from hina.mesoscale.clustering import hina_communities

def create_test_graph():
    B = nx.Graph()
    B = nx.Graph()
    B.add_nodes_from(['Alice', 'Bob', 'Charlie'], bipartite='student', group=['A', 'B', 'B'])
    B.add_nodes_from(['ask questions', 'answer questions', 'evaluating', 'monitoring'], bipartite='object', attr=['cognitive', 'cognitive', 'metacognitive', 'metacognitive'])
    B.add_weighted_edges_from([
        ('Alice', 'ask questions', 2),
        ('Alice', 'evaluating', 1),
        ('Bob', 'answer questions', 3),
        ('Charlie', 'monitoring', 1)
    ])
    return B

def test_hina_communities():
    """Test the hina_communities function without fixing the number of communities."""
    G = create_test_graph()
    results = hina_communities(G)
    
    # Validate the structure of the returned results
    assert isinstance(results, dict)
    assert 'number of communities' in results
    assert 'node communities' in results
    assert 'community structure quality value' in results
    assert 'updated graph object' in results

    
    # Validate the types of returned values
    assert isinstance(results['number of communities'], int)
    assert isinstance(results['node communities'], dict)
    assert isinstance(results['community structure quality value'], float)
    assert isinstance(results['updated graph object'], nx.Graph)
 

if __name__ == "__main__":
    pytest.main()
