import pytest
import pandas as pd
import numpy as np
from hina.individual.quantity_diversity import quantity_and_diversity

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
