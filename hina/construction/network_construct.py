from collections import Counter

def get_bipartite(df,subject_col,attribute_col):
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

    if isinstance(subject_col, tuple):
        new_col1 = '_'.join(list(subject_col))
        df[new_col1] = df[list(subject_col)].apply(lambda row: tuple(row), axis=1)
    else:
        new_col1 = subject_col

    if isinstance(attribute_col, tuple):
        new_col2 = '_'.join(list(attribute_col))
        df[new_col2] = df[list(attribute_col)].apply(lambda row: tuple(row), axis=1)
    else:
        new_col2 = attribute_col

    edge_dict = Counter([tuple(e) for e in df[[new_col1,new_col2]].values])
    G = set([tuple([it[0][0],it[0][1],it[1]]) for it in edge_dict.items()])
    
    return G

def get_tripartite(df, subject_col, attribute_col1, attribute_col2):
    """
    Builds a tripartite graph object for a heterogeneous interaction network.
    
    It merges the two attribute columns into one new column,
    and then projects the DataFrame onto a bipartite network between the
    subject and the merged attribute.
    
    inputs:
      df: pandas DataFrame
      subject_col: string representing the subject (e.g. student)
      attribute_col1: string representing the first attribute
      attribute_col2: string representing the second attribute
      
    returns:
      A set of tuples (subject, merged_attribute, weight) representing the tripartite graph.
    """
    new_attribute_col = f"{attribute_col1}_{attribute_col2}"
    df[attribute_col1].astype(str).str.strip() + "," + df[attribute_col2].astype(str).str.strip()
    
    return get_bipartite(df, subject_col, new_attribute_col)