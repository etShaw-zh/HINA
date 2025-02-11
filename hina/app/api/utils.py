import base64
import io
import pandas as pd
import networkx as nx
from hina.dyad.significant_edges import prune_edges
from hina.mesoscale.clustering import cluster_nodes
from hina.individual.quantity_diversity import get_bipartite, quantity_and_diversity

def parse_contents(encoded_contents: str) -> pd.DataFrame:
    """
    Decode a base64-encoded CSV string and return a pandas DataFrame.
    """
    decoded = base64.b64decode(encoded_contents)
    return pd.read_csv(io.StringIO(decoded.decode('utf-8')))

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
        edge_tuples = [(u, v, d['weight']) for u, v, d in G.edges(data=True)]
        if isinstance(pruning, dict):
            significant_edges = prune_edges(edge_tuples, **pruning)
        else:
            significant_edges = prune_edges(edge_tuples)
        G_new = nx.Graph()
        for u, v, w in significant_edges:
            G_new.add_edge(u, v, weight=w)
        G = G_new

    for node in G.nodes():
        if node in df[attribute_1].astype(str).values:
            G.nodes[node]['type'] = 'attribute_1'
            G.nodes[node]['color'] = 'blue'
        elif node in df[attribute_2].astype(str).values:
            G.nodes[node]['type'] = 'attribute_2'
            G.nodes[node]['color'] = 'grey'
        else:
            G.nodes[node]['type'] = 'unknown'
            G.nodes[node]['color'] = 'black'
    
    if layout == 'bipartite':
        attribute_1_nodes = {n for n, d in G.nodes(data=True) if d['type'] == 'attribute_1'}
        if not nx.is_bipartite(G):
            raise ValueError("The graph is not bipartite; check the input data.")
        pos = nx.bipartite_layout(G, attribute_1_nodes, align='vertical', scale=2, aspect_ratio=4)
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
    """
    elements = []
    for node, data in G.nodes(data=True):
        node_str = str(node)
        x = pos[node][0] * 400 + 300
        y = pos[node][1] * 400 + 300
        elements.append({
            'data': {'id': node_str, 'label': node_str},
            'position': {'x': x, 'y': y},
            'classes': data.get('type', '')
        })
    for u, v, d in G.edges(data=True):
        elements.append({
            'data': {'source': str(u), 'target': str(v), 'weight': d.get('weight', 1)}
        })
    return elements

def build_clustered_network(df: pd.DataFrame, group: str, attribute_1: str, attribute_2: str,
                            clustering_method: str, pruning="none", layout="spring"):
    """
    Build a clustered network using get_bipartite and cluster_nodes.
    """
    if group != 'All':
        df = df[df['group'] == group]
    
    G_edges = get_bipartite(df, attribute_1, attribute_2)
    if pruning != "none":
        edge_tuples = list(G_edges)
        if isinstance(pruning, dict):
            pruned = prune_edges(edge_tuples, **pruning)
        else:
            pruned = prune_edges(edge_tuples)
        G_edges = pruned
    cluster_labels = cluster_nodes(G_edges, method=clustering_method)
    nx_G = nx.Graph()
    for edge in G_edges:
        nx_G.add_edge(str(edge[0]), str(edge[1]), weight=edge[2])
    for node in nx_G.nodes():
        nx_G.nodes[node]['cluster'] = cluster_labels.get(str(node), -1)
    unique_clusters = sorted(set(cluster_labels.values()) | {-1})
    colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33']
    color_map = {}
    for i, label in enumerate(unique_clusters):
        color_map[label] = 'grey' if label == -1 else colors[i % len(colors)]
    for node in nx_G.nodes():
        cl = nx_G.nodes[node]['cluster']
        nx_G.nodes[node]['color'] = color_map.get(cl, 'black')
    if layout == 'bipartite':
        pos = nx.spring_layout(nx_G, k=0.2)
    elif layout == 'spring':
        pos = nx.spring_layout(nx_G, k=0.2)
    elif layout == 'circular':
        pos = nx.circular_layout(nx_G)
    else:
        pos = nx.spring_layout(nx_G, k=0.2)
    return nx_G, pos
