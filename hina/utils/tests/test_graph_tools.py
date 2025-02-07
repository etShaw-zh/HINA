import pytest
from hina.utils.graph_tools import save_network
import os

def test_save_network_gml(tmp_path):
    G = [(1, 2, 0.5), (2, 3, 0.75)]
    filename = tmp_path / "test_network"
    save_network(G, str(filename), format='gml')
    assert os.path.exists(str(filename) + '.gml')

def test_save_network_gexf(tmp_path):
    G = [(1, 2, 0.5), (2, 3, 0.75)]
    filename = tmp_path / "test_network"
    save_network(G, str(filename), format='gexf')
    assert os.path.exists(str(filename) + '.gexf')

def test_save_network_graphml(tmp_path):
    G = [(1, 2, 0.5), (2, 3, 0.75)]
    filename = tmp_path / "test_network"
    save_network(G, str(filename), format='graphml')
    assert os.path.exists(str(filename) + '.graphml')

def test_save_network_unsupported_format(tmp_path):
    G = [(1, 2, 0.5), (2, 3, 0.75)]
    filename = tmp_path / "test_network"
    with pytest.raises(ValueError, match="Unsupported format: unsupported"):
        save_network(G, str(filename), format='unsupported')

if __name__ == "__main__":
    pytest.main()
