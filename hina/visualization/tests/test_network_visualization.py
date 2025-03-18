import pytest
import pandas as pd
import matplotlib
matplotlib.use('Agg')
from hina.visualization.network_visualization import plot_hina, plot_bipartite_clusters

@pytest.fixture
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


def test_plot_HINA(sample_data):
    try:
        plot_hina(B, layout='spring')
    except Exception as e:
        pytest.fail(f"plot_HINA raised an exception: {e}")

def test_plot_HINA_invalid_layout(sample_data):
    with pytest.raises(ValueError):
        plot_hina(B, layout='invalid')


if __name__ == "__main__":
    pytest.main()
