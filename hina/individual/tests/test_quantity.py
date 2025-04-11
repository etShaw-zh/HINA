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
    # Create a bipartite network
    df = create_test_dataframe()
    B = get_bipartite(
        df,
        student_col='student', 
        object_col='object1', 
        attr_col='attr', 
        group_col='group'
    )
    return B

def test_quantity():
    # Test the quantity function
    B = create_test_graph()
    
    quantity_results, _ = quantity(B, attr='attr', group='group', return_type='all')
    
    # Test quantity values
    assert quantity_results['quantity']['Alice'] == 2, "Alice should have quantity 2"
    assert quantity_results['quantity']['Bob'] == 1, "Bob should have quantity 1"
    assert quantity_results['quantity']['Charlie'] == 1, "Charlie should have quantity 1"
    
    # Test normalized quantity values
    assert quantity_results['normalized_quantity']['Alice'] == 0.5, "Alice should have normalized quantity 0.5"
    assert quantity_results['normalized_quantity']['Bob'] == 0.25, "Bob should have normalized quantity 0.25"
    assert quantity_results['normalized_quantity']['Charlie'] == 0.25, "Charlie should have normalized quantity 0.25"
    
    # Test quantity by category
    categories = quantity_results['quantity_by_category']
    assert categories[('Alice', 'cognitive')] == 1.0, "Alice should have 1 cognitive interaction"
    assert categories[('Alice', 'metacognitive')] == 1.0, "Alice should have 1 metacognitive interaction"
    assert categories[('Bob', 'cognitive')] == 1.0, "Bob should have 1 cognitive interaction"
    assert categories[('Charlie', 'metacognitive')] == 1.0, "Charlie should have 1 metacognitive interaction"
    
    # Test normalized quantity by group
    normalized_by_group = quantity_results['normalized_quantity_by_group']
    assert normalized_by_group['Alice'] == 1.0, "Alice should have normalized group quantity 1.0"
    assert normalized_by_group['Bob'] == 0.5, "Bob should have normalized group quantity 0.5"
    assert normalized_by_group['Charlie'] == 0.5, "Charlie should have normalized group quantity 0.5"

if __name__ == "__main__":
    pytest.main()