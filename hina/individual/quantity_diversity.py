from collections import Counter
import numpy as np

def get_bipartite(df,col1,col2):
    """
    projection of dataset onto bipartite network with nodes in col1 and col2 of dataset
        can use composite indices, e.g. col2 = (col A,col B) to merge attributes A,B
        weight of edge (i,j) determined by the number of times (i,j) occurs in the dataset
    inputs:
        dataframe df
        strings col1 and col2 representing columns of the dataframe
    returns:
        set of tuples (i,j,w) representing (source node, destination node, weight of edge)
    """

    if isinstance(col1, tuple):
        new_col1 = '_'.join(list(col1))
        df[new_col1] = df[list(col1)].apply(lambda row: tuple(row), axis=1)
    else:
        new_col1 = col1

    if isinstance(col2, tuple):
        new_col2 = '_'.join(list(col2))
        df[new_col2] = df[list(col2)].apply(lambda row: tuple(row), axis=1)
    else:
        new_col2 = col2

    edge_dict = Counter([tuple(e) for e in df[[new_col1,new_col2]].values])
    G = set([tuple([it[0][0],it[0][1],it[1]]) for it in edge_dict.items()])
    
    return G

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
