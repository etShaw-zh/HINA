import pytest
import networkx as nx
import numpy as np
import pandas as pd
from hina.individual import diversity
from hina.individual import quantity
from hina.construction import get_bipartite

def create_test_dataframe():
    # Create a sample DataFrame for testing
    df = pd.DataFrame({
        'student': ['Alice', 'Bob', 'Alice', 'Charlie'],
        'object1': ['ask questions', 'answer questions', 'evaluating', 'monitoring'],
        'object2': ['tilt head', 'shake head', 'nod head', 'nod head'],
        'group': ['A', 'B', 'A', 'B'],
        'attr': ['cognitive', 'cognitive', 'metacognitive', 'metacognitive']
    })
    return df

def create_test_graph():
    # Create a bipartite network from the test DataFrame
    df = create_test_dataframe()
    B = get_bipartite(
        df,
        student_col='student', 
        object_col='object1', 
        attr_col='attr', 
        group_col='group'
    )
    return B

def test_diversity():
    # Test the diversity function
    B = create_test_graph()
    
    diversity_results, _ = diversity(B, attr='attr')
    
    # Test diversity values
    assert abs(diversity_results['Alice'] - 1.0) < 1e-6, "Alice should have diversity 1.0"
    # Bob and Charlie have only one type of interaction, so diversity should be 0 or -0.0
    assert diversity_results['Bob'] <= 1e-6, "Bob should have diversity 0 or -0.0"
    assert diversity_results['Charlie'] <= 1e-6, "Charlie should have diversity 0 or -0.0"
    
    # Verify all students have diversity scores
    assert set(diversity_results.keys()) == {'Alice', 'Bob', 'Charlie'}, "All students should have diversity scores"

def test_diversity_without_attr():
    # Test the diversity function without attribute column
    # Create a graph without attr
    df = create_test_dataframe()
    B = get_bipartite(
        df,
        student_col='student', 
        object_col='object1', 
        attr_col=None, 
        group_col='group'
    )
    
    diversity_results, _ = diversity(B, attr=None)
    
    # Test that all students are included
    assert 'Alice' in diversity_results, "Diversity for Alice should be computed."
    assert 'Bob' in diversity_results, "Diversity for Bob should be computed."
    assert 'Charlie' in diversity_results, "Diversity for Charlie should be computed."

def test_diversity_with_zero_weight_edges():
    # Test diversity calculation for students with only zero-weight connections
    B = create_test_graph()
    # Now manually set edge weights to 0
    for edge in list(B.edges()):
        if edge[0] == 'Alice' or edge[1] == 'Alice':
            B[edge[0]][edge[1]]['weight'] = 0
    
    # Calculate diversity
    diversity_results, _ = diversity(B, attr='attr')
    
    # Verify diversity for all students
    assert 'Alice' in diversity_results, "Alice should be included in diversity results"
    assert diversity_results['Alice'] == 0, "Alice with only zero-weight connections should have diversity = 0"

if __name__ == "__main__":
    pytest.main()