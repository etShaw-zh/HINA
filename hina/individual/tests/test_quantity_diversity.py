import pytest
import pandas as pd
import numpy as np
from hina.individual.quantity_diversity import get_bipartite, quantity_and_diversity

def test_get_bipartite_simple():
    data = {'student': ['A', 'B', 'A', 'C'], 'task': ['X', 'Y', 'X', 'Z']}
    df = pd.DataFrame(data)
    result = get_bipartite(df, 'student', 'task')
    expected = {('A', 'X', 2), ('B', 'Y', 1), ('C', 'Z', 1)}
    assert result == expected

def test_get_bipartite_composite():
    data = {'student': ['A', 'B', 'A', 'C'], 'task1': ['X', 'Y', 'X', 'Z'], 'task2': [1, 2, 1, 3]}
    df = pd.DataFrame(data)
    result = get_bipartite(df, 'student', ('task1', 'task2'))
    expected = {('A', ('X', 1), 2), ('B', ('Y', 2), 1), ('C', ('Z', 3), 1)}
    assert result == expected

def test_quantity_and_diversity():
    data = {'student': ['A', 'B', 'A', 'B'], 'task': ['X', 'Y', 'X', 'Z']}
    df = pd.DataFrame(data)
    quantities, diversities = quantity_and_diversity(df, 'student', 'task')
    expected_quantities = {'B': 0.5, 'A': 0.5}
    expected_diversities = {'B': np.log(2)/np.log(3), 'A': 0.0}
    assert expected_quantities == quantities
    assert expected_diversities == diversities

if __name__ == "__main__":
    pytest.main()
