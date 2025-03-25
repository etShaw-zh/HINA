import base64
import io
import pandas as pd
import networkx as nx
import numpy as np
import matplotlib.colors as mcolors
from hina.dyad.significant_edges import prune_edges
# from hina.mesoscale import bipartite_communities
from hina.mesoscale import hina_communities
from hina.construction import get_bipartite, get_tripartite
from hina.individual import quantity, diversity

def parse_contents(encoded_contents: str, filename: str) -> pd.DataFrame:
    """
    Decode a base64-encoded file content and return a pandas DataFrame.
    Supports both CSV and XLSX formats.
    """
    decoded = base64.b64decode(encoded_contents)
    if filename.lower().endswith('.csv'):
        return pd.read_csv(io.StringIO(decoded.decode('utf-8')))
    elif filename.lower().endswith('.xlsx'):
        return pd.read_excel(io.BytesIO(decoded))
    else:
        raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file")

def order_edge(u, v, df: pd.DataFrame, student_col: str, object_col: str, weight):
    """
    Given two node identifiers u and v (which may be of any type), force
    the edge tuple to have the node from student_col always first and the node
    from object_col always second. If both nodes belong to the same attribute,
    they are sorted lexicographically.
    
    Parameters:
    -----------
    u, v : any
        Node identifiers from the graph
    df : pandas.DataFrame
        The input DataFrame containing the data
    student_col : str
        The column name in the DataFrame representing student nodes
    object_col : str
        The column name in the DataFrame representing object nodes
    weight : int
        The weight of the edge
        
    Returns:
    --------
    tuple
        (student_node, object_node, weight) or sorted nodes with weight if ambiguous
    """
    u_str = str(u)
    v_str = str(v)
    student_nodes = set(df[student_col].astype(str).values)
    object_nodes = set(df[object_col].astype(str).values)
    
    if u_str in student_nodes and v_str in object_nodes:
        return (u_str, v_str, weight)
    elif u_str in object_nodes and v_str in student_nodes:
        return (v_str, u_str, weight)
    else:
        # If both nodes are in the same attribute or ambiguous, sort lexicographically.
        return tuple(sorted([u_str, v_str])) + (weight,)
        
# def build_hina_network(df: pd.DataFrame, group: str, attribute_1: str, attribute_2: str, pruning, layout: str):
#     """
#     Build a NetworkX graph for the HINA network.
#     """

#     if group != 'All':
#         df = df[df['group'] == group]
    
#     G_edges = get_bipartite(df, attribute_1, attribute_2)
#     G_edges_ordered = [order_edge(u, v, df, attribute_1, attribute_2, int(w)) for u, v, w in G_edges]
    
#     if pruning != "none":
#         if isinstance(pruning, dict):
#             significant_edges = prune_edges(G_edges_ordered, **pruning)
#         else:
#             significant_edges = prune_edges(G_edges_ordered)
#         significant_edges = significant_edges or set()
#         G_edges_ordered = list(significant_edges)

#     nx_G = nx.Graph()
#     for edge in G_edges_ordered:
#         nx_G.add_edge(edge[0], edge[1], weight=int(edge[2]))

#     # Assign node types and colors
#     for node in nx_G.nodes():
#         if node in df[attribute_1].astype(str).values:
#             nx_G.nodes[node]['type'] = 'attribute_1'
#             nx_G.nodes[node]['color'] = 'grey'
#         elif node in df[attribute_2].astype(str).values:
#             nx_G.nodes[node]['type'] = 'attribute_2'
#             nx_G.nodes[node]['color'] = 'blue'
#         else:
#             nx_G.nodes[node]['type'] = 'unknown'
#             nx_G.nodes[node]['color'] = 'black'

#     for u, v, d in nx_G.edges(data=True):
#         d['label'] = str(d.get('weight', ''))

#     if layout == 'bipartite':
#         attribute_1_nodes = {n for n, d in nx_G.nodes(data=True) if d['type'] == 'attribute_1'}
#         if not nx.is_bipartite(nx_G):
#             raise ValueError("The graph is not bipartite; check the input data.")
#         pos = nx.bipartite_layout(nx_G, attribute_1_nodes, align='vertical', scale=1.5, aspect_ratio=0.7)
#     elif layout == 'spring':
#         pos = nx.spring_layout(nx_G, k=0.2)
#     elif layout == 'circular':
#         pos = nx.circular_layout(nx_G)
#     else:
#         raise ValueError(f"Unsupported layout: {layout}")
#     return nx_G, pos, G_edges_ordered

def build_hina_network(df: pd.DataFrame, group_col: str, group: str, student_col: str, object1_col: str, attr_col: str, pruning, layout: str):
    """
    Build a NetworkX graph for the HINA network.
    
    Parameters:
    -----------
    df : pandas.DataFrame
        The input DataFrame containing the data to construct the bipartite graph.
    group_col : str
        The column name in the DataFrame representing group information for student nodes.
    group : str
        The specific group to filter by, or 'All' to include all groups.
    student_col : str
        The column name in the DataFrame representing student nodes.
    object1_col : str
        The column name in the DataFrame representing the studied object nodes.
    attr_col : str
        The column name in the DataFrame representing attributes for object nodes.
    pruning : str or dict
        Controls edge pruning strategy. "none" for no pruning, or a dictionary with 
        parameters for the prune_edges function.
    layout : str
        Layout for node positioning: "bipartite", "spring", or "circular".
    
    Returns:
    --------
    tuple
        (nx_G, pos, G_edges_ordered) - The network graph, node positions, and edge list.
    """
    # Filter by group 
    if group != 'All' and group_col in df.columns:
        df = df[df[group_col] == group]
    
    # Create the bipartite graph
    B = get_bipartite(df, student_col, object1_col, attr_col, group_col)
    G_edges_ordered = [order_edge(u, v, df, student_col, object1_col, int(w.get('weight', 1))) for u, v, w in B.edges(data=True)]

    # Prune edges 
    if pruning != "none":
        if isinstance(pruning, dict):
            significant_edges_result = prune_edges(B, **pruning)
        else:
            significant_edges_result = prune_edges(B)
        
        if isinstance(significant_edges_result, dict) and "significant edges" in significant_edges_result:
            significant_edges = significant_edges_result["significant edges"]
        else:
            significant_edges = significant_edges_result or set()
            
        G_edges_ordered = list(significant_edges)
    
    # Create a new graph with the significant edges
    nx_G = nx.Graph()
    for edge in G_edges_ordered:
        nx_G.add_edge(edge[0], edge[1], weight=int(edge[2]))
    
    # Assign node types and colors
    for node in nx_G.nodes():
        node_str = str(node)
        if node_str in df[student_col].astype(str).values:
            nx_G.nodes[node]['type'] = 'student'
            nx_G.nodes[node]['color'] = 'grey'
        elif node_str in df[object1_col].astype(str).values:
            nx_G.nodes[node]['type'] = 'object'
            nx_G.nodes[node]['color'] = 'blue'
        else:
            nx_G.nodes[node]['type'] = 'unknown'
            nx_G.nodes[node]['color'] = 'black'
    
    # Add edge labels
    for u, v, d in nx_G.edges(data=True):
        d['label'] = str(d.get('weight', ''))
    
    # Set the layout
    if layout == 'bipartite':
        student_nodes = {n for n, d in nx_G.nodes(data=True) if d['type'] == 'student'}
        if not nx.is_bipartite(nx_G):
            raise ValueError("The graph is not bipartite; check the input data.")
        pos = nx.bipartite_layout(nx_G, student_nodes, align='vertical', scale=1.5, aspect_ratio=0.7)
    elif layout == 'spring':
        pos = nx.spring_layout(nx_G, k=0.2)
    elif layout == 'circular':
        pos = nx.circular_layout(nx_G)
    else:
        raise ValueError(f"Unsupported layout: {layout}")
    
    return nx_G, pos, G_edges_ordered

def cy_elements_from_graph(G: nx.Graph, pos: dict):
    """
    Convert a NetworkX graph and its layout positions into Cytoscape elements.
    Each node element now includes its color in its data.
    """
    elements = []
    for node, data in G.nodes(data=True):
        node_str = str(node)
        x = pos[node][0] * 400 + 300
        y = pos[node][1] * 400 + 300
        elements.append({
            'data': {
                'id': node_str,
                'label': node_str,
                'color': data.get('color', 'black')  
            },
            'position': {'x': x, 'y': y},
            'classes': data.get('type', '')
        })
    for u, v, d in G.edges(data=True):
        elements.append({
            'data': {
                'source': str(u),
                'target': str(v),
                'weight': d.get('weight', 0),
                'label': d.get('label', str(d.get('weight', '')))
            }
        })
    return elements

def build_clustered_network(df: pd.DataFrame, group: str, attribute_1: str, attribute_2: str, 
                            number_cluster=None, pruning="none", layout="bipartite"):
    """
    Build a clustered network using get_bipartite and bipartite_communities.
    
    Colors:
      - Nodes in attribute_1 are colored based on their community using TABLEAU_COLORS.
      - Nodes in attribute_2 are fixed as blue.
    """
    if group != 'All':
        df = df[df['group'] == group]
    
    G_edges = get_bipartite(df, attribute_1, attribute_2)
    G_edges_ordered = [order_edge(u, v, df, attribute_1, attribute_2, int(w)) for u, v, w in G_edges]
    
    if pruning != "none":
        if isinstance(pruning, dict):
            significant_edges = prune_edges(G_edges_ordered, **pruning)
        else:
            significant_edges = prune_edges(G_edges_ordered)
        significant_edges = significant_edges or set()
        G_edges_ordered = list(significant_edges)
    
    if number_cluster not in (None, "", "none"):
        try:
            number_cluster = int(number_cluster)
        except ValueError:
            number_cluster = None
    else:
        number_cluster = None
    
    # Run community detection (clustering)
    cluster_labels, compression_ratio = bipartite_communities(G_edges_ordered, fix_B=number_cluster)
    
    nx_G = nx.Graph()
    for edge in G_edges_ordered:
        nx_G.add_edge(edge[0], edge[1], weight=int(edge[2]))
    
    # Determine which nodes belong to each attribute
    attr1_nodes = set(df[attribute_1].astype(str).values)
    attr2_nodes = set(df[attribute_2].astype(str).values)
    for node in nx_G.nodes():
        if node in attr1_nodes:
            nx_G.nodes[node]['type'] = 'attribute_1'
        elif node in attr2_nodes:
            nx_G.nodes[node]['type'] = 'attribute_2'
        else:
            nx_G.nodes[node]['type'] = 'unknown'
    
    for node in nx_G.nodes():
        nx_G.nodes[node]['cluster'] = str(cluster_labels.get(str(node), "-1"))
    
    # Build color mapping for attribute_1 nodes based on community labels.
    communities = sorted({nx_G.nodes[node]['cluster'] 
                          for node in nx_G.nodes() 
                          if nx_G.nodes[node]['type'] == 'attribute_1'})
    comm_colors = dict(zip(communities, list(mcolors.TABLEAU_COLORS.values())[:len(communities)]))
    
    for node in nx_G.nodes():
        if nx_G.nodes[node]['type'] == 'attribute_1':
            cluster_label = nx_G.nodes[node]['cluster']
            nx_G.nodes[node]['color'] = comm_colors.get(cluster_label, 'grey')
        elif nx_G.nodes[node]['type'] == 'attribute_2':
            nx_G.nodes[node]['color'] = 'blue'
        else:
            nx_G.nodes[node]['color'] = 'black'
    
    for u, v, d in nx_G.edges(data=True):
        d['label'] = str(d.get('weight', ''))
    
    offset = np.random.rand() * np.pi
    radius = 1 # radius of the circle 20/3 * radius/noise_scale
    noise_scale = 0.16 
    # For nodes in attribute_1: position based on community label.
    set1_pos = {}
    for node in attr1_nodes.intersection(set(nx_G.nodes())):
        comm = nx_G.nodes[node].get('cluster', "-1")
        comm_index = communities.index(comm) if comm in communities else 0
        angle = 2 * np.pi * comm_index / len(communities) + offset
        x = radius * np.cos(angle) + (2 * np.random.rand() - 1) * noise_scale
        y = radius * np.sin(angle) + (2 * np.random.rand() - 1) * noise_scale
        set1_pos[node] = (x, y)
    # For nodes in attribute_2: arrange in a circle (half radius)
    set2_pos = {}
    for node in attr2_nodes.intersection(set(nx_G.nodes())):
        attr2_list = sorted(list(attr2_nodes.intersection(set(nx_G.nodes()))))
        num_s2 = len(attr2_list)
        index = attr2_list.index(node)
        angle = 2 * np.pi * index / num_s2 + offset
        x = 0.5 * radius * np.cos(angle)
        y = 0.5 * radius * np.sin(angle)
        set2_pos[node] = (x, y)
    
    pos_custom = {**set1_pos, **set2_pos}
    
    if layout == 'bipartite':
        pos = pos_custom
    elif layout == 'spring':
        pos = nx.spring_layout(nx_G, k=0.2)
    elif layout == 'circular':
        pos = nx.circular_layout(nx_G)
    else:
        pos = pos_custom
    
    return nx_G, pos, cluster_labels