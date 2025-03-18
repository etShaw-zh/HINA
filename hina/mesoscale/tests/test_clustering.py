import pytest
import networkx as nx
from hina.mesoscale.clustering import hina_communities

def create_test_graph():
    G = nx.Graph()
    edges = [(1, 'a', 1), (1, 'b', 2), (2, 'a', 1), (3, 'c', 1), (4, 'd', 1)]
    G.add_weighted_edges_from(edges)
    # Add bipartite attributes
    for node in [1, 2, 3, 4]:
        G.nodes[node]['bipartite'] = 'set1'
    for node in ['a', 'b', 'c', 'd']:
        G.nodes[node]['bipartite'] = 'set2'
    return G

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
    assert 'sub graphs for each community' in results
    
    # Validate the types of returned values
    assert isinstance(results['number of communities'], int)
    assert isinstance(results['node communities'], dict)
    assert isinstance(results['community structure quality value'], float)
    assert isinstance(results['updated graph object'], nx.Graph)
    assert isinstance(results['sub graphs for each community'], dict)
    
    # Validate the node communities mapping
    for node, community in results['node communities'].items():
        assert isinstance(node, str)
        assert isinstance(community, int)

def test_hina_communities_fixed_B():
    """Test the hina_communities function with a fixed number of communities."""
    G = create_test_graph()
    fix_B = 2
    results = hina_communities(G, fix_B=fix_B)
    
    # Validate the number of communities is fixed
    assert results['number of communities'] == fix_B
    
    # Validate the structure and types of returned results
    assert isinstance(results, dict)
    assert 'number of communities' in results
    assert 'node communities' in results
    assert 'community structure quality value' in results
    assert 'updated graph object' in results
    assert 'sub graphs for each community' in results
    
    # Validate the types of returned values
    assert isinstance(results['number of communities'], int)
    assert isinstance(results['node communities'], dict)
    assert isinstance(results['community structure quality value'], float)
    assert isinstance(results['updated graph object'], nx.Graph)
    assert isinstance(results['sub graphs for each community'], dict)

if __name__ == "__main__":
    pytest.main()
