import pytest
import pandas as pd
import networkx as nx
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for testing
import matplotlib.pyplot as plt
from hina.construction import get_bipartite
from hina.mesoscale import hina_communities
from hina.visualization.network_visualization import plot_hina, plot_bipartite_clusters

def create_test_graph():
    # Create a test graph from DataFrame using get_bipartite 
    df = pd.DataFrame({
        'student': ['Alice', 'Bob', 'Alice', 'Charlie'],
        'object1': ['ask questions', 'answer questions', 'evaluating', 'monitoring'],
        'object2': ['tilt head', 'shake head', 'nod head', 'nod head'],
        'group': ['A', 'B', 'A', 'B'],
        'attr': ['cognitive', 'cognitive', 'metacognitive', 'metacognitive']
    })
    
    B = get_bipartite(
        df,
        student_col='student', 
        object_col='object1', 
        attr_col='attr', 
        group_col='group'
    )
    return B

def test_plot_hina_basic():
    # Test basic functionality of plot_hina
    B = create_test_graph()
    
    # Test with default parameters
    fig = plot_hina(B)
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

def test_plot_hina_with_layout():
    # Test plot_hina with different layout options
    B = create_test_graph()
    
    # Test with bipartite layout
    fig = plot_hina(B, layout='bipartite')
    assert isinstance(fig, plt.Figure)
    plt.close(fig)
    
    # Test with spring layout
    fig = plot_hina(B, layout='spring')
    assert isinstance(fig, plt.Figure)
    plt.close(fig)
    
    # Test with circular layout
    fig = plot_hina(B, layout='circular')
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

def test_plot_hina_with_group_filtering():
    # Test plot_hina with group filtering
    B = create_test_graph()
    
    # Test for all groups (no filtering)
    fig = plot_hina(B, layout='bipartite', group_name=['group', None])
    assert isinstance(fig, plt.Figure)
    plt.close(fig)
    
    # Test for specific group
    fig = plot_hina(B, layout='bipartite', group_name=['group', 'A'])
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

def test_plot_hina_with_pruning():
    # Test plot_hina with pruning parameters
    B = create_test_graph()
    
    # Test with custom pruning parameters
    pruning_kwargs = {'fix_deg': 'None', 'alpha': 0.05}
    fig = plot_hina(B, pruning_kwargs=pruning_kwargs)
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

def test_plot_hina_with_networkx_kwargs():
    # Test plot_hina with custom NetworkX parameters
    B = create_test_graph()  # Fixed: call the function to get the graph
    
    # Test with custom NetworkX parameters
    networkx_kwargs = {'node_color': 'red', 'node_size': 100}
    fig = plot_hina(B, NetworkX_kwargs=networkx_kwargs)
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

def test_plot_bipartite_clusters_auto():
    # Test plot_bipartite_clusters with automatic community detection
    B = create_test_graph()
    
    # Test with automatic community detection
    fig = plot_bipartite_clusters(B)
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

def test_plot_bipartite_clusters_fixed():
    # Test plot_bipartite_clusters with fixed number of communities
    B = create_test_graph()
    
    # Test with fixed number of communities
    fig = plot_bipartite_clusters(B, fix_B=2)
    assert isinstance(fig, plt.Figure)
    plt.close(fig)

if __name__ == "__main__":
    pytest.main()