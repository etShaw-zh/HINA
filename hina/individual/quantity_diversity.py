import networkx as nx 
from collections import defaultdict
import numpy as np 
import pandas as pd 

def quantity(B, attr = None, group = None, return_type='all'):
    
    """
    Computes various quantities and normalized quantities for student nodes in a bipartite graph, 
    for gauzing the quantity of individual involvement in the studied objects

    This function calculates the following metrics for nodes in a bipartite graph `B`:
    - **Quantity**: The total weight of edges connected to each student node.
    - **Normalized Quantity**: The quantity normalized by the total weight of all edges in the graph.
    - **Quantity by Category**: The total weight of edges of individual student nodes to each category of the object nodes.
    - **Normalized Quantity by Group**: The quantity normalized by the total weight of edges within each group.

    Parameters:
    -----------
    B : networkx.Graph
        A bipartite graph with weighted edges. Nodes are expected to have attributes if `attr` or `group` is provided.
    attr : str, optional
        The name of the object node attribute used to categorize the connected object nodes. If provided, the function calculates
        quantity by category. Default is None.
    group : str, optional
        The name of the student node attribute used to group nodes. If provided, the function calculates normalized quantity
        by group. Default is None.
    return_type : str, optional
        Specifies the type of results to return. Options are:
        - 'all': Returns all computed quantities (default).
        - 'quantity': Returns only the raw quantity for each node.
        - 'quantity_by_category': Returns only the quantity partitioned by category.
        - 'normalized_quantity': Returns only the normalized quantity for each node.
        - 'normalized_quantity_by_group': Returns only the normalized quantity by group.

    Returns:
    --------
    dict
        A dictionary containing the computed quantities based on the `return_type` parameter. The keys in the dictionary
        depend on the `return_type` and may include:
        - 'quantity': A dictionary mapping each node to its total edge weight.
        - 'normalized_quantity': A dictionary mapping each node to its normalized edge weight.
        - 'quantity_by_category': A dictionary mapping (node, category) tuples to their total edge weight.
        - 'normalized_quantity_by_group': A dictionary mapping each node to its normalized edge weight within its group.

   dataframe
       A dataframe containing all available quantities of each student node
    """

    W = sum(data['weight'] for _, _, data in B.edges(data=True))
    
    normalized_quantity = {}
    quantity_by_category = defaultdict(float)
    normalized_quantity_by_group = {}
    group_sums = defaultdict(float)
    quantity = {}

    for i, j, wij in B.edges(data='weight'):
        
        if i not in quantity:
            quantity[i] = 0
        quantity[i] += wij
        
        # Normalize quantity based on total weight
        if i not in normalized_quantity:
            normalized_quantity[i] = 0
        normalized_quantity[i] += wij / W

        # Individual quantity for each object attribute category
        if attr is not None:
            v = B.nodes[j][attr]
            quantity_by_category[(i, v)] += wij

        # Update group sums
        if group is not None:
            g = B.nodes[i][group]
            group_sums[g] += wij

    # Normalize quantity by group
    normalized_quantity_by_group = {
        k: v / group_sums[B.nodes[k][group]] if group_sums[B.nodes[k][group]] != 0 else 0
        for k, v in quantity.items() if group in B.nodes[k]
    }

     # organize the results into a dataframe for return 
    quantity_df = pd.DataFrame.from_dict(quantity, orient='index', columns=['quantity'])
    normalized_df = pd.DataFrame.from_dict(normalized_quantity,\
                                           orient='index', columns=['normalized_quantity'])
    result_df = quantity_df.join([normalized_df])
    
    if group is not None:
        group_df = pd.DataFrame.from_dict(normalized_quantity_by_group, 
                                        orient='index', 
                                        columns=['normalized_quantity_by_group'])
        result_df = result_df.join(group_df)

    if attr is not None:
        category_data = []
        for (id_category, category), value in quantity_by_category.items():
            category_data.append({
                'username': id_category,
                'category': category,
                'quantity_by_category': value
            })
        category_df = pd.DataFrame(category_data)
        category_pivot = category_df.pivot(index='username', columns='category', values='quantity_by_category')
        category_pivot.columns = [f'quantity_{col}' for col in category_pivot.columns]
        
        result_df = result_df.join(category_pivot)
    
    results = {'quantity': quantity,'normalized_quantity': normalized_quantity,}
    
    if attr is not None:
        results['quantity_by_category'] = quantity_by_category
    if group is not None:
        results['normalized_quantity_by_group'] = normalized_quantity_by_group

    if return_type == 'quantity':
        return {'quantity': results['quantity']}
    elif return_type == 'quantity_by_category':
        return {'quantity_by_category': results['quantity_by_category']}
    elif return_type == 'normalized_quantity':
        return {'normalized_quantity': results['normalized_quantity']}
    elif return_type == 'normalized_quantity_by_group':
        return {'normalized_quantity_by_group': results['normalized_quantity_by_group']}
    else:
        return results, result_df 



def diversity(B, attr=None):
    """
    Computes the diversity value of individual nodes in a bipartite graph based on a specified attribute or the object nodeset.

    The diversity value is calculated based on Shannon entropy formula, normalized by the logarithm of the number of unique attribute categories.
    It measures how evenly a student's connections are distributed across different objects or object attribute categories.

    Parameters:
    -----------
    B : networkx.Graph
        A bipartite graph. Nodes need to have a 'bipartite' attribute indicating their partition. 
    attr : str, optional
        The column name of the attribute related to the studied objects in the input dataframe. 
        For example, if the bipartite graph B represents relationships between students and interaction codes (e.g., (student, interaction_codes)), 
        the attr could be a column like interaction_dimensions, which categorizes the interaction codes into broader dimensions.
        If attr is provided, diversity is calculated based on the categories of the specified attribute.
        If attr is None, the function uses the object nodes themselves (e.g., interaction_codes) 
        as the target for diversity calculation.

    Returns:
    --------
    dict
        A dictionary where keys are nodes and values are their diversity values. 
        The diversity value is a float between 0 and 1,
        where 0 indicates no diversity (all connections of an indivdiual to a single category) 
        and 1 indicates maximum diversity (evenly distributed
        connections across all categories).
     dataframe
       A dataframe containing diversity value of each student node
    """
  
    v = set()
    node_bipartite_list = [x for x in [data['bipartite'] for n, data in B.nodes(data=True)]\
                     if not (x in v or v.add(x))]
    
    if attr is None:
        attr_set = [j for i,j in B.edges]
    else:
        attr_set = [data[attr] for n, data in B.nodes(data=True) if data.get('bipartite') == node_bipartite_list[1]]
        
    quantity_by_attr = defaultdict(lambda: defaultdict(float))

    # Iterate over edges
    for i, j, wij in B.edges(data='weight'):
        if j in attr_set:  
            quantity_by_attr[i][j] += wij
        elif B.nodes[j][attr] in attr_set: 
            j = B.nodes[j][attr]
            quantity_by_attr[i][j] += wij
    
    N = len(set(attr_set))

    diversity = {}
    for i in quantity_by_attr:
        wi = sum(quantity_by_attr[i].values())  # Total weight for node i
        if wi > 0:  # Avoid division by zero
            diversity[i] = -sum((w / wi) * np.log(w / wi) for w in quantity_by_attr[i].values() if w > 0)
            diversity[i] /= np.log(N) 
        else:
            diversaity[i] = 0  
    diversity_df = pd.DataFrame(list(diversity.items()), columns=['username', 'diversity'])
    return diversity, diversity_df
