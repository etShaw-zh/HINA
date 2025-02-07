import pytest
import numpy as np
from hina.mesoscale.clustering import cluster_nodes, bipartite_communities

def test_cluster_nodes_modularity():
    G = [(1, 'a'), (1, 'b'), (2, 'a'), (3, 'c'), (4, 'd')]
    result = cluster_nodes(G, method='modularity')
    print(f"Cluster Nodes Result: {result}")  # Debug output
    assert isinstance(result, dict)

    for k, v in result.items():
        print(f"Key: '{k}' (type: {type(k)}), Value: {v} (type: {type(v)})")
        assert (isinstance(k, (int, str, np.str_)) and (k.isdigit() if isinstance(k, (str, np.str_)) else True)), f"Invalid key: {k}" 
        assert isinstance(v, (int, np.int64, np.integer)), f"Invalid value: {v}"

def test_cluster_nodes_sbm():
    G = [(1, 'a'), (1, 'b'), (2, 'a'), (3, 'c'), (4, 'd')]
    result = cluster_nodes(G, method='SBM')
    assert result is None  # SBM method is not implemented


def test_bipartite_communities():
    G = [(1, 'a', 1), (1, 'b', 2), (2, 'a', 1), (3, 'c', 1), (4, 'd', 1)]
    community_labels, compression_ratio = bipartite_communities(G)
    assert isinstance(community_labels, dict)
    assert all(isinstance(k, str) and isinstance(v, str) for k, v in community_labels.items())
    assert isinstance(compression_ratio, float)

def test_bipartite_communities_fixed_B():
    G = [(1, 'a', 1), (1, 'b', 2), (2, 'a', 1), (3, 'c', 1), (4, 'd', 1)]
    community_labels, compression_ratio = bipartite_communities(G, fix_B=2)
    assert isinstance(community_labels, dict)
    assert all(isinstance(k, str) and isinstance(v, str) for k, v in community_labels.items())
    assert isinstance(compression_ratio, float)

if __name__ == "__main__":
    pytest.main()
