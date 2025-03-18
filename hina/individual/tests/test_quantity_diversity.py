import pytest
import networkx as nx
import numpy as np
from hina.analysis.metrics import quantity, diversity

def test_quantity():
    """
    Test the `quantity` function to ensure it correctly computes quantities and normalized quantities
    for student nodes in a bipartite graph.
    """
    # Create a sample bipartite graph
    B = nx.Graph()
    B.add_nodes_from(['Alice', 'Bob', 'Charlie'], bipartite='student', group=['A', 'B', 'B'])
    B.add_nodes_from(['ask questions', 'answer questions', 'evaluating', 'monitoring'], bipartite='object', attr=['cognitive', 'cognitive', 'metacognitive', 'metacognitive'])
    B.add_weighted_edges_from([
        ('Alice', 'ask questions', 2),
        ('Alice', 'evaluating', 1),
        ('Bob', 'answer questions', 3),
        ('Charlie', 'monitoring', 1)
    ])

    # Test quantity calculation without attributes or groups
    result = quantity(B)
    assert 'quantity' in result, "Quantity should be computed."
    assert 'normalized_quantity' in result, "Normalized quantity should be computed."
    assert result['quantity']['Alice'] == 3, "Quantity for Alice is incorrect."
    assert np.isclose(result['normalized_quantity']['Alice'], 3 / 7), "Normalized quantity for Alice is incorrect."

    # Test quantity by category
    result = quantity(B, attr='attr')
    assert 'quantity_by_category' in result, "Quantity by category should be computed."
    assert result['quantity_by_category'][('Alice', 'cognitive')] == 2, "Quantity by category for Alice and cognitive is incorrect."

    # Test normalized quantity by group
    result = quantity(B, group='group')
    assert 'normalized_quantity_by_group' in result, "Normalized quantity by group should be computed."
    assert np.isclose(result['normalized_quantity_by_group']['Alice'], 3 / 5), "Normalized quantity by group for Alice is incorrect."

def test_diversity():
    """
    Test the `diversity` function to ensure it correctly computes diversity values for student nodes
    in a bipartite graph.
    """
    # Create a sample bipartite graph
    B = nx.Graph()
    B.add_nodes_from(['Alice', 'Bob', 'Charlie'], bipartite='student')
    B.add_nodes_from(['ask questions', 'answer questions', 'evaluating', 'monitoring'], bipartite='object', attr=['cognitive', 'cognitive', 'metacognitive', 'metacognitive'])
    B.add_weighted_edges_from([
        ('Alice', 'ask questions', 2),
        ('Alice', 'evaluating', 1),
        ('Bob', 'answer questions', 3),
        ('Charlie', 'monitoring', 1)
    ])

    # Test diversity calculation without attributes
    result = diversity(B)
    assert 'Alice' in result, "Diversity for Alice should be computed."
    assert np.isclose(result['Alice'], 0.918, atol=0.001), "Diversity for Alice is incorrect."

    # Test diversity calculation with attributes
    result = diversity(B, attr='attr')
    assert 'Alice' in result, "Diversity for Alice should be computed with attributes."
    assert np.isclose(result['Alice'], 0.918, atol=0.001), "Diversity for Alice with attributes is incorrect."

if __name__ == "__main__":
    pytest.main()
