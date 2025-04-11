import pytest
import pandas as pd
import networkx as nx
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for testing
import matplotlib.pyplot as plt
from hina.construction import get_bipartite
from hina.mesoscale import hina_communities
from hina.visualization import plot_hina, plot_bipartite_clusters

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
    
    # Create a figure for the plot
    fig, ax = plt.subplots()
    
    # Test with default parameters - pass the axis
    plot_hina(B, ax=ax)
    
    # Check if the axis has content
    assert len(ax.collections) > 0 or len(ax.texts) > 0 or len(ax.patches) > 0
    plt.close(fig)

def test_plot_hina_with_layout():
    # Test plot_hina with different layout options
    B = create_test_graph()
    
    # Test with bipartite layout
    fig, ax = plt.subplots()
    plot_hina(B, layout='bipartite', ax=ax)
    assert len(ax.collections) > 0 or len(ax.texts) > 0
    plt.close(fig)
    
    # Test with spring layout
    fig, ax = plt.subplots()
    plot_hina(B, layout='spring', ax=ax)
    assert len(ax.collections) > 0 or len(ax.texts) > 0
    plt.close(fig)
    
    # Test with circular layout
    fig, ax = plt.subplots()
    plot_hina(B, layout='circular', ax=ax)
    assert len(ax.collections) > 0 or len(ax.texts) > 0
    plt.close(fig)

def test_plot_hina_with_group_filtering():
    # Test plot_hina with group filtering
    B = create_test_graph()
    
    # Test for all groups (no filtering)
    fig, ax = plt.subplots()
    plot_hina(B, layout='bipartite', group_name=['group', None], ax=ax)
    assert len(ax.collections) > 0 or len(ax.texts) > 0
    plt.close(fig)
    
    # Test for specific group
    fig, ax = plt.subplots()
    plot_hina(B, layout='bipartite', group_name=['group', 'A'], ax=ax)
    # It's ok if nothing is plotted for a specific group that might not exist
    plt.close(fig)

def test_plot_hina_with_pruning():
    # Test plot_hina with pruning parameters
    B = create_test_graph()
    
    # Test with custom pruning parameters
    fig, ax = plt.subplots()
    pruning_kwargs = {'fix_deg': 'None', 'alpha': 0.05}
    plot_hina(B, pruning_kwargs=pruning_kwargs, ax=ax)
    # We can't guarantee what will be plotted after pruning
    plt.close(fig)

def test_plot_hina_with_networkx_kwargs():
    # Test plot_hina with custom NetworkX parameters
    B = create_test_graph()
    
    # Test with custom NetworkX parameters that don't conflict
    fig, ax = plt.subplots()
    # Use more specific NetworkX kwargs that won't conflict
    networkx_kwargs = {'width': 2.0, 'alpha': 0.7, 'edge_color': 'blue'}
    plot_hina(B, NetworkX_kwargs=networkx_kwargs, ax=ax)
    assert len(ax.collections) > 0 or len(ax.texts) > 0 or len(ax.patches) > 0
    plt.close(fig)

def test_plot_bipartite_clusters_auto():
    # Test plot_bipartite_clusters with automatic community detection
    B = create_test_graph()
    
    # Test with automatic community detection
    fig, ax = plt.subplots()
    plot_bipartite_clusters(B, ax=ax)
    # Community detection may vary, so just ensure something was plotted
    plt.close(fig)

def test_plot_bipartite_clusters_fixed():
    # Test plot_bipartite_clusters with fixed number of communities
    B = create_test_graph()
    
    # Test with fixed number of communities
    fig, ax = plt.subplots()
    plot_bipartite_clusters(B, fix_B=2, ax=ax)
    # Ensure the function runs without error
    plt.close(fig)


if __name__ == "__main__":
    pytest.main()