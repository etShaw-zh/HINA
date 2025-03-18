import pytest
import networkx as nx
from hina.dyad.significant_edges import prune_edges

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

def test_prune_edges_no_fix_deg():
    G = create_test_graph()
    result = prune_edges(G)
    assert isinstance(result, dict)
    assert "pruned network" in result, "Result should contain 'pruned network' key"
    assert "significant edges" in result, "Result should contain 'significant edges' key"
    assert isinstance(result["pruned network"], Pruned_B), "'pruned network' should be of type Pruned_B"
    assert isinstance(result["significant edges"], set), "'significant edges' should be a set"
    assert len(result["significant edges"]) > 0, "'significant edges' should not be empty"

def test_prune_edges_fix_deg_set1():
    G = create_test_graph()
    result = prune_edges(G, fix_deg='Set 1')
    assert isinstance(result, set)
    assert "pruned network" in result, "Result should contain 'pruned network' key"
    assert "significant edges" in result, "Result should contain 'significant edges' key"
    assert isinstance(result["pruned network"], Pruned_B), "'pruned network' should be of type Pruned_B"
    assert isinstance(result["significant edges"], set), "'significant edges' should be a set"
    assert len(result["significant edges"]) > 0, "'significant edges' should not be empty"

def test_prune_edges_fix_deg_set2():
    G = create_test_graph()
    result = prune_edges(G, fix_deg='Set 2')
    assert "pruned network" in result, "Result should contain 'pruned network' key"
    assert "significant edges" in result, "Result should contain 'significant edges' key"
    assert isinstance(result["pruned network"], Pruned_B), "'pruned network' should be of type Pruned_B"
    assert isinstance(result["significant edges"], set), "'significant edges' should be a set"
    assert len(result["significant edges"]) > 0, "'significant edges' should not be empty"

if __name__ == "__main__":
    pytest.main()
