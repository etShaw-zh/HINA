import pytest
import numpy as np
from hina.mesoscale.clustering import bipartite_communities

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
