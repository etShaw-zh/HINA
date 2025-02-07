import pytest
from hina.dyad.significant_edges import prune_edges

def test_prune_edges_no_fix_deg():
    G = [(1, 2, 5), (1, 3, 10), (2, 3, 15)]
    alpha = 0.05
    result = prune_edges(G, alpha, fix_deg=None)
    assert isinstance(result, set)
    assert len(result) > 0

def test_prune_edges_fix_deg_set1():
    G = [(1, 2, 5), (1, 3, 10), (2, 3, 15)]
    alpha = 0.05
    result = prune_edges(G, alpha, fix_deg='Set 1')
    assert isinstance(result, set)
    assert len(result) > 0

def test_prune_edges_fix_deg_set2():
    G = [(1, 2, 5), (1, 3, 10), (2, 3, 15)]
    alpha = 0.05
    result = prune_edges(G, alpha, fix_deg='Set 2')
    assert isinstance(result, set)
    assert len(result) > 0

def test_prune_edges_empty_graph():
    G = []
    alpha = 0.05
    result = prune_edges(G, alpha, fix_deg=None)
    assert result == set()

def test_prune_edges_single_edge():
    G = [(1, 2, 5)]
    alpha = 0.05
    result = prune_edges(G, alpha, fix_deg=None)
    assert isinstance(result, set)
    assert len(result) == 1

# if __name__ == "__main__":
#     pytest.main()