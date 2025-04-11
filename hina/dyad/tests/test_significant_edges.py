import pytest
import pandas as pd
import networkx as nx
from hina.construction import get_bipartite
from hina.dyad import prune_edges

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

def create_test_bipartite():
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

def test_prune_edges_no_fixing():
    # Test prune_edges with no degree fixing
    B = create_test_bipartite()
    result = prune_edges(B, fix_deg='None', alpha=0.05)
    
    assert isinstance(result, dict)
    assert "pruned network" in result
    assert "significant edges" in result
    assert isinstance(result["significant edges"], set)
    
    # Check if all edges from the original example are present
    expected_edges = {
        ('Alice', 'ask questions', 1), 
        ('Alice', 'evaluating', 1),
        ('Bob', 'answer questions', 1), 
        ('Charlie', 'monitoring', 1)
    }
    
    # Convert both to sets of tuples for comparison
    result_edges = {(s, o, w) for s, o, w in result["significant edges"]}
    expected_edges_set = {(s, o, w) for s, o, w in expected_edges}
    
    assert result_edges == expected_edges_set

def test_prune_edges_fix_student():
    # Test prune_edges with fixed degrees for student nodes
    B = create_test_bipartite()
    result = prune_edges(B, fix_deg='student', alpha=0.05)
    
    assert "pruned network" in result
    assert "significant edges" in result
    assert isinstance(result["significant edges"], set)
    
    # Based on the example, with student degrees fixed, we expect a subset of edges
    expected_subset = {
        ('Bob', 'answer questions', 1),
        ('Charlie', 'monitoring', 1)
    }
    
    # Convert both to sets of tuples for comparison
    result_edges = {(s, o, w) for s, o, w in result["significant edges"]}    
    assert len(result_edges) <= 4
    
    # Check that the expected subset is contained in the result
    for edge in expected_subset:
        assert edge in result_edges

def test_prune_edges_fix_object():
    # Test prune_edges with fixed degrees for object nodes
    B = create_test_bipartite()
    result = prune_edges(B, fix_deg='object1', alpha=0.05)
    
    assert "pruned network" in result
    assert "significant edges" in result
    
    # Based on the example, with object degrees fixed, we expect all edges
    expected_edges = {
        ('Alice', 'ask questions', 1), 
        ('Alice', 'evaluating', 1),
        ('Bob', 'answer questions', 1), 
        ('Charlie', 'monitoring', 1)
    }
    
    # Convert both to sets of tuples for comparison
    result_edges = {(s, o, w) for s, o, w in result["significant edges"]}
    expected_edges_set = {(s, o, w) for s, o, w in expected_edges}
    
    assert result_edges == expected_edges_set

def test_prune_edges_stricter_alpha():
    # Test prune_edges with a stricter significance level
    B = create_test_bipartite()
    result = prune_edges(B, fix_deg='None', alpha=0.01)
    
    assert "pruned network" in result
    assert "significant edges" in result    
    assert len(result["significant edges"]) <= 4

def test_prune_edges_custom_weights():
    # Test prune_edges with custom edge weights
    df = pd.DataFrame({
        'student': ['Alice', 'Bob', 'Alice', 'Alice', 'Bob'],
        'object1': ['ask questions', 'answer questions', 'ask questions', 'evaluating', 'evaluating'],
        'group': ['A', 'B', 'A', 'A', 'B'],
        'attr': ['cognitive', 'cognitive', 'cognitive', 'metacognitive', 'metacognitive']
    })
    
    B = get_bipartite(
        df,
        student_col='student',
        object_col='object1',
        attr_col='attr',
        group_col='group'
    )
    
    result = prune_edges(B, fix_deg='None', alpha=0.05)
    
    assert "pruned network" in result
    assert "significant edges" in result
    
    # Check if the weighted edge Alice-ask questions is significant
    alice_ask = False
    for edge in result["significant edges"]:
        if edge[0] == 'Alice' and edge[1] == 'ask questions':
            alice_ask = True
            assert edge[2] == 2, "Expected weight of Alice-ask questions edge to be 2"
            break
    
    assert alice_ask, "Edge ('Alice', 'ask questions') should be significant"

if __name__ == "__main__":
    pytest.main()