import pytest
import pandas as pd
from hina.construction.network_construct import get_bipartite

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

if __name__ == "__main__":
    pytest.main()