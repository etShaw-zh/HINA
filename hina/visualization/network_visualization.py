import networkx as nx
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from hina.dyad.significant_edges import prune_edges
from hina.mesoscale.clustering import cluster_nodes
from hina.individual.quantity_diversity import get_bipartite


def plot_HINA(df, group='All', attribute_1=None, attribute_2=None, pruning=False, layout='spring', NetworkX_kwargs=None):
    """
    Plots a bipartite network visualization with specified attributes and layout.

    Parameters:
    - df (pd.DataFrame): Input dataframe containing the network data.
    - group (str): Group to filter and plot (default: 'All' for entire dataset).
    - attribute_1 (str): Column name for the first node set (e.g., 'student id').
    - attribute_2 (str): Column name for the second node set (e.g., 'task').
    - pruning (bool or dict): Whether to prune edges using significance logic. 
                              If dict, specifies parameters for pruning.
    - layout (str): Layout to use for node positioning. Supported layouts:
                    - 'bipartite': Nodes are positioned in two vertical columns.
                    - 'spring': Force-directed layout for a visually appealing arrangement.
                    - 'circular': Nodes are arranged in a circle.
    - NetworkX_kwargs (dict): Additional arguments for NetworkX visualization.

    Returns:
    - None: Displays a plot of the bipartite network.

    """
    if NetworkX_kwargs is None:
        NetworkX_kwargs = {}

    if attribute_1 is None or attribute_2 is None:
        raise ValueError("Both 'attribute_1' and 'attribute_2' must be specified.")

    if group != 'All':
        df = df[df['group'] == group]

    G = nx.Graph()
    for _, row in df.iterrows():
        G.add_node(row[attribute_1])
        G.add_node(row[attribute_2])
        G.add_edge(row[attribute_1], row[attribute_2], weight=row['task weight'])

    if pruning:
        edge_tuples = [(u, v, d['weight']) for u, v, d in G.edges(data=True)]
        if isinstance(pruning, dict):
            significant_edges = prune_edges(edge_tuples, **pruning)
        else:
            significant_edges = prune_edges(edge_tuples)
        G = nx.Graph()
        for u, v, w in significant_edges:
            G.add_edge(u, v, weight=w)

    for node in G.nodes:
        if node in df[attribute_1].values:
            G.nodes[node]['type'] = 'attribute_1'
            G.nodes[node]['color'] = 'blue'
        elif node in df[attribute_2].values:
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

    max_y = max(abs(y) for _, y in pos.values())  
    label_offset = max_y * 0.03  

    node_colors = [d['color'] for _, d in G.nodes(data=True)]
    edge_widths = [d['weight'] / 15 for _, _, d in G.edges(data=True)]

    plt.figure(figsize=(12, 12))
    nx.draw(
        G,
        pos,
        with_labels=False,
        node_color=node_colors,
        width=edge_widths,
        node_size=200,
        **NetworkX_kwargs
    )

    for node, (x, y) in pos.items():
        label = str(node)
        plt.text(
            x, y + label_offset,  
            label,
            fontsize=9,
            ha='center',
            va='center',
            color='black'
        )

    plt.title(f"HINA Network Visualization: Group = {group}")
    plt.show()

def plot_clusters(df, group='All', attribute_1=None, attribute_2=None, pruning=False, clustering_method='modularity', NetworkX_kwargs=None):
    """
    Plots a clustered bipartite network for the selected group.

    Parameters:
    - df (pd.DataFrame): Input dataframe containing the network data.
    - group (str): Group to filter and plot (default: 'All' for the entire dataset).
    - attribute_1 (str): Column name for the first node set (e.g., 'student id').
    - attribute_2 (str): Column name for the second node set (e.g., 'task').
    - pruning (bool or dict): Whether to prune edges using significance logic. 
                              If dict, specifies parameters for pruning.
    - clustering_method (str): Clustering method to use for grouping nodes. 
                               Supported methods:
                               - 'modularity': Louvain modularity clustering for bipartite graphs.
                               - 'SBM': Stochastic Block Model (for future implementation).
    - NetworkX_kwargs (dict): Additional arguments for NetworkX visualization.

    Returns:
    - None: Displays a plot of the clustered bipartite network.
    """
    if NetworkX_kwargs is None:
        NetworkX_kwargs = {}

    # Filter the dataframe by the selected group
    if group != 'All':
        df = df[df['group'] == group]

    if attribute_1 is None or attribute_2 is None:
        raise ValueError("Both 'attribute_1' and 'attribute_2' must be specified.")

    G = get_bipartite(df, attribute_1, attribute_2)

    cluster_labels = cluster_nodes(G, method=clustering_method)
    print("Cluster labels:", cluster_labels)

    nx_G = nx.Graph()
    for edge in G:
        nx_G.add_edge(edge[0], edge[1], weight=edge[2])

    for node in nx_G.nodes:
        nx_G.nodes[node]['cluster'] = cluster_labels.get(str(node), -1)  # Default cluster is -1 for unclustered nodes

    unique_clusters = sorted(set(cluster_labels.values()) | {-1})  # Include -1 for unclustered nodes
    label_to_color = {label: idx for idx, label in enumerate(unique_clusters)}  # Map labels to indices

    cmap = plt.get_cmap('tab10', len(unique_clusters))  # Dynamically get a colormap with enough colors
    label_to_color[-1] = 'grey'  # Set grey for unclustered nodes

    node_colors = [
        'grey' if nx_G.nodes[node]['cluster'] == -1 else cmap(label_to_color[nx_G.nodes[node]['cluster']])
        for node in nx_G.nodes
    ]

    pos = nx.spring_layout(nx_G, k=0.2)
    max_y = max(abs(y) for _, y in pos.values())  
    label_offset = max_y * 0.07  

    plt.figure(figsize=(12, 8))
    nx.draw(
        nx_G,
        pos,
        with_labels=False,
        node_color=node_colors,
        node_size=800,
        edge_color='gray',
        width=1,
        **NetworkX_kwargs
    )

    for node, (x, y) in pos.items():
        plt.text(
            x, y + label_offset,  
            str(node),
            fontsize=9,
            ha='center',
            va='center',
            color='black'
        )

    legend_elements = [
        Line2D(
            [0], [0],
            marker='o',
            color='w',
            markerfacecolor='grey' if label == -1 else cmap(idx),
            markersize=10,
            label=f'Cluster {label}' if label != -1 else attribute_2
        )
        for label, idx in label_to_color.items()
    ]
    plt.legend(handles=legend_elements, loc='upper right', title='Clusters', frameon=True)

    plt.title(f"Clustered Bipartite Network ({clustering_method.capitalize()} Method) for Group: {group}")
    plt.show()