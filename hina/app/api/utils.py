import base64
import io
import pandas as pd
import networkx as nx
import numpy as np
from hina.dyad.significant_edges import prune_edges
from hina.mesoscale.clustering import bipartite_communities
from hina.individual.quantity_diversity import get_bipartite, quantity_and_diversity

def parse_contents(encoded_contents: str) -> pd.DataFrame:
    """
    Decode a base64-encoded CSV string and return a pandas DataFrame.
    """
    decoded = base64.b64decode(encoded_contents)
    return pd.read_csv(io.StringIO(decoded.decode('utf-8')))

def order_edge(u, v, df: pd.DataFrame, attribute_1: str, attribute_2: str, weight):
    """
    Given two node identifiers u and v (which may be of any type), force
    the edge tuple to have the node from attribute_1 always first and the node
    from attribute_2 always second. If both nodes belong to the same attribute,
    they are sorted lexicographically.
    """
    u_str = str(u)
    v_str = str(v)
    a1_nodes = set(df[attribute_1].astype(str).values)
    a2_nodes = set(df[attribute_2].astype(str).values)
    if u_str in a1_nodes and v_str in a2_nodes:
        return (u_str, v_str, weight)
    elif u_str in a2_nodes and v_str in a1_nodes:
        return (v_str, u_str, weight)
    else:
        # If both nodes are in the same attribute or ambiguous, sort lexicographically.
        return tuple(sorted([u_str, v_str])) + (weight,)

def build_hina_network(df: pd.DataFrame, group: str, attribute_1: str, attribute_2: str, pruning, layout: str):
    """
    Build a NetworkX graph for the HINA network.
    """
    if group != 'All':
        df = df[df['group'] == group]
    
    G = nx.Graph()
    for _, row in df.iterrows():
        n1 = str(row[attribute_1])
        n2 = str(row[attribute_2])
        weight = row.get('task weight', 1)
        G.add_node(n1)
        G.add_node(n2)
        G.add_edge(n1, n2, weight=weight)
    
    if pruning != "none":
        edge_tuples = [order_edge(u, v, df, attribute_1, attribute_2, d['weight'])
                       for u, v, d in G.edges(data=True)]
        if isinstance(pruning, dict):
            significant_edges = prune_edges(edge_tuples, **pruning)
        else:
            significant_edges = prune_edges(edge_tuples)
        significant_edges = significant_edges or set()
        pruned_edges = [edge for edge in edge_tuples if edge not in significant_edges]
        G_new = nx.Graph()
        for u, v, w in significant_edges:
            G_new.add_edge(u, v, weight=w)
        G = G_new
    else:
        # No pruning applied
        pass

    # Assign node types and colors
    for node in G.nodes():
        if node in df[attribute_1].astype(str).values:
            G.nodes[node]['type'] = 'attribute_1'
            G.nodes[node]['color'] = 'grey'
        elif node in df[attribute_2].astype(str).values:
            G.nodes[node]['type'] = 'attribute_2'
            G.nodes[node]['color'] = 'blue'
        else:
            G.nodes[node]['type'] = 'unknown'
            G.nodes[node]['color'] = 'black'

    for u, v, d in G.edges(data=True):
        d['label'] = str(d.get('weight', ''))

    if layout == 'bipartite':
        attribute_1_nodes = {n for n, d in G.nodes(data=True) if d['type'] == 'attribute_1'}
        if not nx.is_bipartite(G):
            raise ValueError("The graph is not bipartite; check the input data.")
        pos = nx.bipartite_layout(G, attribute_1_nodes, align='vertical', scale=1.5, aspect_ratio=0.7)
    elif layout == 'spring':
        pos = nx.spring_layout(G, k=0.2)
    elif layout == 'circular':
        pos = nx.circular_layout(G)
    else:
        raise ValueError(f"Unsupported layout: {layout}")
    return G, pos

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
                            number_cluster=None, pruning="none", layout="biaprtite"):
    """
    Build a clustered network using get_bipartite and cluster_nodes.
    Adapts node, edge, and position style similar to plot_bipartite_clusters.
    """
    if group != 'All':
        df = df[df['group'] == group]
    
    G_edges = get_bipartite(df, attribute_1, attribute_2)
    G_edges_ordered = [order_edge(u, v, df, attribute_1, attribute_2, w) for u, v, w in G_edges]
    
    if pruning != "none":
        if isinstance(pruning, dict):
            pruned = prune_edges(G_edges_ordered, **pruning)
        else:
            pruned = prune_edges(G_edges_ordered)
        G_edges_ordered = pruned or []
    
    cluster_labels, compression_ratio = bipartite_communities(G_edges_ordered, fix_B=number_cluster)
    nx_G = nx.Graph()
    for edge in G_edges_ordered:
        nx_G.add_edge(edge[0], edge[1], weight=edge[2])
    
    # Determine nodes that belong to each attribute
    attr1_nodes = set(df[attribute_1].astype(str).values)
    attr2_nodes = set(df[attribute_2].astype(str).values)
    for node in nx_G.nodes():
        if node in attr1_nodes:
            nx_G.nodes[node]['type'] = 'attribute_1'
            nx_G.nodes[node]['color'] = 'grey'
        elif node in attr2_nodes:
            nx_G.nodes[node]['type'] = 'attribute_2'
            nx_G.nodes[node]['color'] = 'blue'
        else:
            nx_G.nodes[node]['type'] = 'unknown'
            nx_G.nodes[node]['color'] = 'black'
    
    for node in nx_G.nodes():
        nx_G.nodes[node]['cluster'] = str(cluster_labels.get(str(node), "-1"))
    
    for u, v, d in nx_G.edges(data=True):
        d['label'] = str(d.get('weight', ''))
    
    offset = np.random.rand() * np.pi
    radius = 1
    noise_scale = 3.
    
    # For nodes in attribute_1: position based on community label
    # Use the cluster labels as the community indicator.
    communities = set(cluster_labels.values())
    B = len(communities)
    comm2ind = {comm: i for i, comm in enumerate(communities)}
    set1_pos = {}
    for node in attr1_nodes:
        comm = cluster_labels.get(str(node), "-1")
        if comm not in comm2ind:
            comm2ind[comm] = len(comm2ind)
        c = comm2ind[comm]
        angle = 2 * np.pi * c / B + offset
        x = radius * np.cos(angle) + (2 * np.random.rand() - 1) * noise_scale
        y = radius * np.sin(angle) + (2 * np.random.rand() - 1) * noise_scale
        set1_pos[node] = (x, y)
    
    # For nodes in attribute_2: arrange in a circle (half radius)
    set2_pos = {}
    attr2_list = list(attr2_nodes)
    num_s2 = len(attr2_list)
    for i, node in enumerate(attr2_list):
        angle = 2 * np.pi * i / num_s2 + offset
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

