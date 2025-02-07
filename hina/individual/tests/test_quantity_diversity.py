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

def compute_expected_quantities(df, student_col, task_col, weight_col):
    G = get_bipartite(df, student_col, task_col)
    weights_dict = dict(df[[task_col, weight_col]].values)
    total_weight = sum(weights_dict.values())

    expected_quantities = {}
    for i, j, _ in G:
        if i not in expected_quantities:
            expected_quantities[i] = 0
        expected_quantities[i] += weights_dict[j] / total_weight
    return expected_quantities

def test_quantity_and_diversity():
    data = {'student': ['A', 'B', 'A', 'C'], 'task': ['X', 'Y', 'X', 'Z'], 'weight': [1, 2, 1, 3]}
    df = pd.DataFrame(data)
    quantities, diversities = quantity_and_diversity(df, 'student', 'task', 'weight')

    expected_quantities = compute_expected_quantities(df, 'student', 'task', 'weight')
    expected_diversities = {key: 0.0 for key in expected_quantities.keys()}

    for key in expected_quantities:
        print(f"Student: {key}, Actual Quantity: {quantities[key]}, Expected Quantity: {expected_quantities[key]}")
        np.testing.assert_almost_equal(quantities[key], expected_quantities[key], decimal=6)
        np.testing.assert_almost_equal(diversities[key], expected_diversities[key], decimal=6)

def test_quantity_and_diversity_with_composite_task():
    data = {'student': ['A', 'B', 'A', 'C'], 'task1': ['X', 'Y', 'X', 'Z'], 'task2': [1, 2, 1, 3], 'weight': [1, 2, 1, 3]}
    df = pd.DataFrame(data)
    df['task'] = list(zip(df['task1'], df['task2'])) 

    quantities, diversities = quantity_and_diversity(df, 'student', 'task', 'weight')

    expected_quantities = compute_expected_quantities(df, 'student', 'task', 'weight')
    expected_diversities = {key: 0.0 for key in expected_quantities.keys()}

    for key in expected_quantities:
        print(f"Student: {key}, Actual Quantity: {quantities[key]}, Expected Quantity: {expected_quantities[key]}")
        np.testing.assert_almost_equal(quantities[key], expected_quantities[key], decimal=6)
        np.testing.assert_almost_equal(diversities[key], expected_diversities[key], decimal=6)

def test_empty_dataframe():
    df = pd.DataFrame(columns=['student', 'task', 'weight'])
    quantities, diversities = quantity_and_diversity(df, 'student', 'task', 'weight')

    assert quantities == {}
    assert diversities == {}

def test_single_entry():
    data = {'student': ['A'], 'task': ['X'], 'weight': [1]}
    df = pd.DataFrame(data)
    quantities, diversities = quantity_and_diversity(df, 'student', 'task', 'weight')

    print(f"Single Entry - Actual Quantity: {quantities['A']}, Expected Quantity: 1.0")
    np.testing.assert_almost_equal(quantities['A'], 1.0, decimal=6)
    if np.isnan(diversities['A']):
        diversities['A'] = 0.0
    print(f"Single Entry - Actual Diversity: {diversities['A']}, Expected Diversity: 0.0")
    np.testing.assert_almost_equal(diversities['A'], 0.0, decimal=6)

# if __name__ == "__main__":
#     pytest.main()
