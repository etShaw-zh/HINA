import numpy as np
from hina.construction.network_construct import get_bipartite


def quantity_and_diversity(df,student_col,task_col):
    """
    compute quantity and diversity measures of Feng et al 2024 for students in student_col
    inputs:
        df is dataframe
        student_col is column name for student identifiers
        task_col is column name for tasks
    returns:
        quantity and diversity measures for student nodes with respect to indicated tasks,
            in form of dictionaries with {node name: quantity} and {node name: diversity}
    """
    G = get_bipartite(df,student_col,task_col)
    W = sum([e[-1] for e in G])
    N2 = len(set([e[1] for e in G]))
    
    quantities,out_weights = {},{}
    for e in G:
        
        i,j,wij = e
        
        if not(i in quantities): quantities[i] = 0
        quantities[i] += wij/W
    
        if not(i in out_weights): out_weights[i] = {}
        if not(j in out_weights[i]): out_weights[i][j] = 0
        out_weights[i][j] += wij
    
    diversities = {}
    for i in out_weights:
        wi = sum(out_weights[i].values())
        diversities[i] = -sum((out_weights[i][j]/wi)*np.log(out_weights[i][j]/wi) for j in out_weights[i])
        diversities[i] /= np.log(N2)
    
    return quantities,diversities
